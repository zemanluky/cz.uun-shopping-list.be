import type {TLoginData} from "../schema/request/auth.schema.ts";
import {type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {signJwt, verifyJwt} from "../helper/jwt.service.ts";
import {UnauthenticatedError} from "../error/response/unauthenticated.error.ts";
import ms from "ms";
import {addMilliseconds, isAfter} from "date-fns";
import * as R from 'remeda';
import {InvalidJwt} from "../error/invalid-jwt-token.error.ts";

// token lifetime configuration
const accessTokenLifetime = process.env.JWT_ACCESS_LIFETIME || '15m';
const refreshTokenLifetime = process.env.JWT_REFRESH_LIFETIME || '28d';

// max active token config
const maxActiveTokens = process.env.JWT_MAX_ACTIVE_TOKEN !== undefined ? Number(process.env.JWT_MAX_ACTIVE_TOKEN) : 5;

type TTokenPair = { access: string, refresh: string };

/**
 * Creates new access token for the given user.
 * @param user
 */
function createAccessToken(user: THydratedUserDocument): string {
    return signJwt(user._id.toString(), accessTokenLifetime);
}

/**
 * Creates new refresh token. It generates JT
 * @param user
 * @param jti
 */
async function createRefreshToken(user: THydratedUserDocument, jti?: string): Promise<string> {
    const newJti = crypto.randomUUID();
    const token = signJwt(user._id.toString(), refreshTokenLifetime, newJti);

    // we are creating new token, and we need to invalidate the oldest sessions
    if (!jti) {
        user.refresh_tokens.push({
            jti: newJti,
            revoked_at: null,
            issued_at: new Date(),
            valid_until: addMilliseconds(new Date(), ms(refreshTokenLifetime))
        });

        // get ids of tokens older than `n` of active tokens
        const oldestRefreshTokensIds = R.pipe(
            user.refresh_tokens,
            R.filter((rt => rt.revoked_at === null)),
            R.dropFirstBy(maxActiveTokens, [R.prop('issued_at'), 'desc']),
            R.map(rt => rt._id)
        );

        // mark the oldest token as invalidated
        await User.updateOne({ _id: user._id, 'refresh_tokens._id': { $in: oldestRefreshTokensIds } }, {
            $set: {
                'refresh_tokens.$[].revoked_at': new Date()
            }
        });

        // save changes
        await user.save();
    }
    // we are updating existing active token entry
    else {
        await User.updateOne({ _id: user._id, 'refresh_tokens.jti': jti }, {
            $set: {
                "refresh_tokens.$.jti": newJti,
                "refresh_tokens.$.issued_at": new Date(),
                "refresh_tokens.$.valid_until": addMilliseconds(new Date(), ms(refreshTokenLifetime)),
                "refresh_tokens.$.revoked_at": null
            }
        }).exec();
    }

    return token;
}

/**
 * Logs in a given user based on their email and password.
 * It may also accept user's username instead of their email.
 * It generates a JWT access and refresh token.
 */
export async function login(request: TLoginData): Promise<TTokenPair> {
    const user = await User
        .findOne()
        .or([{ email: request.login }, { username: request.login }])
        .exec()
    ;

    // check if the user even exists...
    if (!user)
        throw new UnauthenticatedError('Please check your login credentials.', 'invalid_credentials');

    // verify passwords
    const isPasswordMatch = await Bun.password.verify(request.password, user.password);

    if (!isPasswordMatch)
        throw new UnauthenticatedError('Please check your login credentials.', 'invalid_credentials');

    return { access: createAccessToken(user), refresh: await createRefreshToken(user) };
};

/**
 * Generates a new access token for a given user based on their refresh token
 * This token is first verified for its validity, compared to the collection of active tokens on the user's own data in
 * the database, and upon verifying successfully, a new token pair is returned.
 * @param refreshToken The refresh token.
 */
export async function refresh(refreshToken: string): Promise<TTokenPair> {
    try {
        const result = verifyJwt(refreshToken);

        // the refresh token does not have its ID set, someone is probably trying to use the access token instead...
        if (!result.jti)
            throw new UnauthenticatedError('The refresh token is not valid. Please, login again.', 'session_expired');

        // let's verify the user actually exists
        const user = await User.findById(result.userId).exec();

        if (!user)
            throw new UnauthenticatedError('The user authenticated via the token was not found in the system.');

        // verify that the token with the given jti exists and that it is still valid (not revoked)
        const token = user.refresh_tokens.find(rt => rt.jti === result.jti);

        if (!token || token.revoked_at !== null || isAfter(new Date(), token.valid_until))
            throw new UnauthenticatedError('The authentication session has expired. Please, log in again.', 'session_expired');

        return { access: createAccessToken(user), refresh: await createRefreshToken(user, result.jti) };
    }
    catch (error: any) {
        if (error instanceof InvalidJwt)
            throw new UnauthenticatedError('The session has expired or the token is not valid. Please, log in again.', 'session_expired');

        throw error;
    }
}

/**
 * Verifies a given access token for validity and returns the user, if the token is valid.
 * @param accessToken The user's access token.
 * @return The user document.
 */
export async function verify(accessToken: string): Promise<THydratedUserDocument> {
    try {
        const result = verifyJwt(accessToken);
        const user = await User.findById(result.userId).exec();

        if (!user)
            throw new UnauthenticatedError('The user authenticated via the token was not found in the system.');

        return user;
    }
    catch (error: any) {
        if (error instanceof InvalidJwt)
            throw new UnauthenticatedError('The access token is not valid. Please, refresh your authentication.');

        throw error;
    }
}

/**
 * Invalidates the refresh token, when valid.
 * When invalid, it just ignores it.
 */
export async function logout(refreshToken: string): Promise<void> {
    // catch errors as we don't care if the token ends up invalid
    try {
        const {jti, userId} = verifyJwt(refreshToken);

        if (!jti) return;

        // set the revoked parameter of the token
        await User.updateOne({ _id: userId, 'refresh_tokens.jti': jti }, {
            $set: { 'refresh_tokens.$.revoked_at': new Date() }
        }).exec();
    }
    catch (error: any) {
        if (error instanceof InvalidJwt) return;

        // when we don't know the error, we definitely want to throw that so that it gets logged
        throw error;
    }
}