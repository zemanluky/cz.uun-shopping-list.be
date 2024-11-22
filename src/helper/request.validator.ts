import type {Request, Response} from "express";
import {z, type ZodRawShape, ZodSchema, ZodType, type ZodTypeAny} from "zod";
import {ZodError, ZodObject} from "zod";
import type {NextFunction} from "express";
import {ValidationError} from "../error/response/validation.error.ts";
import type {IAppRequest} from "../../types";

/**
 * Validates the body of a request.
 * Use as a handler before the main controller endpoint handler.
 *
 * @param schema The schema to use for validation.
 */
export function bodyValidator<T extends ZodTypeAny>(schema: T) {
    return (req: IAppRequest, res: Response, next: NextFunction) => {
        // try parsing the request body
        try {
            req.body = schema.parse(req.body);
            next();
        }
        // could not parse / did not pass validations
        catch (err: any) {
            // when the error was thrown due to invalid properties
            if (err instanceof ZodError)
                next(new ValidationError(err.issues));

            // the error was thrown because we could not parse the object / unknown validation issues
            next(new ValidationError());
        }
    };
}

/**
 * Validates query parameters on a given endpoint with provided Zod schema.
 * Use as a handler before the main controller endpoint handler.
 *
 * @param schema
 */
export function queryValidator<T extends ZodTypeAny>(schema: T) {
    return (req: IAppRequest<never,ReturnType<typeof schema.parse>>, res: Response, next: NextFunction) => {
        // try parsing the request query
        try {
            req.parsedQuery = schema.parse(req.query);
            next();
        }
        // catch invalid object or validation errors
        catch (err: any) {
            // when the error was thrown due to invalid properties
            if (err instanceof ZodError)
                next(new ValidationError(err.issues, 'query'));

            // the error was thrown because we could not parse the object / unknown validation issues
            next(new ValidationError(null, 'query'));
        }
    };
}

/**
 * Validates the parameters in path of a given controller endpoint.
 * Use as a handler before the main controller endpoint handler.
 *
 * @param schema
 */
export function paramValidator<T extends ZodTypeAny>(schema: T) {
    return (req: IAppRequest<ReturnType<typeof schema.parse>>, res: Response, next: NextFunction) => {
        // try parsing the request parameters
        try {
            req.parsedParams = schema.parse(req.params);
            next();
        }
        // catch invalid object or validation errors
        catch (err: any) {
            // when the error was thrown due to invalid properties
            if (err instanceof ZodError)
                next(new ValidationError(err.issues, 'params'));

            // the error was thrown because we could not parse the object / unknown validation issues
            next(new ValidationError(null, 'params'));
        }
    };
}