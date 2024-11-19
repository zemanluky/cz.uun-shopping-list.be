import {type NextFunction, type Response} from "express";
import {UnauthenticatedError} from "../error/response/unauthenticated.error.ts";
import {verify} from "../service/auth.service.ts";
import type {IAppRequest} from "../../types";

/**
 * Extracts JWT token from Bearer auth header.
 * @param headerValue
 * @return null when the token could not be extracted, the string token otherwise.
 */
function extractToken(headerValue: string): string|null {
    const parts = headerValue.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;

    return parts[1];
}

/**
 * Authenticates the request based on the JWT token in the Authorization header.
 * @param required Whether the user is required to be authenticated.
 */
export function authenticateRequest(required: boolean = true) {
    return (req: IAppRequest, res: Response, next: NextFunction) => {
        req.user = null;
        const header = req.headers.authorization;

        // the authorization header is not present even though we require the user to be authenticated
        if (header === undefined)
            return required
                ? next(new UnauthenticatedError('Could not find the authorization header.'))
                : next()
            ;

        const token = extractToken(header);

        // the header is invalid, we could not extract the token successfully
        if (!token)
            return next(new UnauthenticatedError('Invalid authorization header.'));

        verify(token).then(user => {
            req.user = user;
            next();
        });
    };
}