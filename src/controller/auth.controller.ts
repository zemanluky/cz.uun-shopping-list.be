import express, {type Request, type Response} from "express";
import {bodyValidator} from "../helper/request.validator.ts";
import {loginBodySchema, type TLoginData} from "../schema/request/auth.schema.ts";
import {login, logout, refresh} from "../service/auth.service.ts";
import {emptyResponse, successResponse} from "../helper/response.helper.ts";
import {UnauthenticatedError} from "../error/response/unauthenticated.error.ts";
import {authenticateRequest, type TAuthReq} from "../helper/request.guard.ts";
import {publicUserData} from "../utils/user.util.ts";

// Name of the refresh token cookie.
const APP_AUTH_COOKIE = process.env.APP_AUTH_COOKIE || '__auth';

export const authController = express.Router();

/**
 * Authenticates a user.
 * Generates new JWT token upon successful login.
 */
authController.post(
    '/login',
    bodyValidator(loginBodySchema),
    async (req: Request<{},{},TLoginData>, res: Response) => {
        const tokenPair = await login(req.body);

        // make the refresh token only accessible by the server (not by JS!)
        res.cookie(APP_AUTH_COOKIE, tokenPair.refresh, { secure: true, httpOnly: true, path: '/auth' });
        successResponse(res, { access_token: tokenPair.access });
    }
);

/**
 * Refreshes user's JWT auth token based on their refresh token cookie.
 */
authController.get('/refresh', async (req: Request, res: Response) => {
    // verify the token is set in the cookie
    if (!(APP_AUTH_COOKIE in req.cookies))
        throw new UnauthenticatedError('Authentication token not found.');

    // generate new token pair
    const tokenPair = await refresh(req.cookies[APP_AUTH_COOKIE]);

    // make the refresh token only accessible by the server (not by JS!)
    res.cookie(APP_AUTH_COOKIE, tokenPair.refresh, { secure: true, httpOnly: true, path: '/auth' });
    successResponse(res, { access_token: tokenPair.access });
});

/**
 * Logs out the currently logged-in user.
 * In other words, it invalidates their refresh token.
 */
authController.delete('/logout', async (req: Request, res: Response) => {
    if (!(APP_AUTH_COOKIE in req.cookies))
        throw new UnauthenticatedError('Authentication token not found.');

    await logout(req.cookies[APP_AUTH_COOKIE]);

    // to remove the cookie successfully, we need to use same options for the cookie (giving the name only would not suffice)
    res.clearCookie(APP_AUTH_COOKIE, { secure: true, httpOnly: true, path: '/auth' });
    emptyResponse(res);
});

/**
 * Gets user's own identity.
 * In other words, it returns the details about the currently logged-in user.
 */
authController.get(
    '/identity',
    authenticateRequest(),
    (req: TAuthReq, res: Response) => {
        successResponse(res, publicUserData(req.user!));
    }
);