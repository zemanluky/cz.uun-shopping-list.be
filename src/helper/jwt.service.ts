import jwt, {JsonWebTokenError, type JwtPayload, NotBeforeError, TokenExpiredError} from "jsonwebtoken";
import {InvalidJwt} from "../error/invalid-jwt-token.error.ts";

const issuer = process.env.JWT_ISSUER || 'uun-shopping-list:be';

/**
 * Gets the JWT signing secret.
 */
const getSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret)
        throw new Error(
            'The secret key must be present in the environment to sign and verify JWT tokens. ' +
            'Check that the JWT_SECRET environment variable is set.'
        );

    return secret;
}

/**
 * Signs a given JWT token.
 */
export const signJwt = (userId: string, expireIn: string, jti?: string): string => {
    const secret = getSecret();

    return jwt.sign({ uid: userId }, secret, {
        algorithm: "HS256",
        issuer: issuer,
        expiresIn: expireIn,
        ...(jti !== undefined ? {jwtid: jti} : {})
    });
}

/**
 * Verifies a given JWT token.
 * @param jwtString
 * @throws InvalidJwt The given token is invalid - trying to authenticate with invalid token.
 */
export const verifyJwt = (jwtString: string): { userId: string, jti?: string} => {
    const secret = getSecret();

    try {
        const payload = jwt.verify(jwtString, secret, {
            algorithms: ['HS256'],
            issuer: [issuer]
        }) as JwtPayload;

        if (payload.uid === undefined)
            throw new InvalidJwt('The provided JWT token is invalid.');

        return { userId: payload.uid, jti: payload.jti };
    }
    catch (error: any) {
        // we know what the error is, the user is trying to authenticate with invalid jwt
        if (error instanceof TokenExpiredError
            || error instanceof JsonWebTokenError
            || error instanceof NotBeforeError
        ) {
            throw new InvalidJwt('The provided JWT token is either invalid or expired/not active.');
        }

        // unknown error, rethrow
        throw error;
    }
}