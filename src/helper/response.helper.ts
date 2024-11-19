import type {Response} from "express";
import {StatusCodes} from "http-status-codes";
import type {ZodIssue} from "zod";
import type {IPaginatedParameters} from "../../types";

type TBaseResponse = {
    status: StatusCodes,
    success: boolean
};

type TSuccessResponse<TData> = TBaseResponse & {
    success: true
    data: TData
};

type TErrorResponse = TBaseResponse & {
    success: false,
    error: {
        message: string,
        code: string,
        trace: string|null
    }
};

type TValidationResponse = TErrorResponse & {
    validation: ZodIssue[]
}

type TPaginatedResponse<TData> = TBaseResponse & {
    success: true,
    data: IPaginatedParameters & {
        items: Array<TData>
    }
}

/**
 * Sends a success response with data.
 * @param res The response object.
 * @param data The data to send in the response.
 * @param statusCode The HTTP status code to send. Generally, you would want to use status codes from the 200 range.
 */
export const successResponse = <TData extends any>(res: Response, data: TData, statusCode: StatusCodes = StatusCodes.OK): void => {
    const response: TSuccessResponse<TData> = {
        status: statusCode,
        success: true,
        data: data
    };

    // send the response as json
    res.status(statusCode).json(response);
}

/**
 * Sends a success response with paginated data.
 * @param res The response object.
 * @param data The array of data to send in the response.
 * @param paginationParameters The parameters of the paginated response.
 * @param statusCode The HTTP status code to send. Generally, you would want to use status codes from the 200 range.
 */
export const paginatedResponse = <TData extends any>(
    res: Response, data: Array<TData>, paginationParameters: IPaginatedParameters, statusCode: StatusCodes = StatusCodes.OK
): void => {
    const response: TPaginatedResponse<TData> = {
        status: statusCode,
        success: true,
        data: {
            ...paginationParameters,
            items: data
        }
    };

    res.status(statusCode).json(response);
}

/**
 * Sends an empty success response. This means, the 204 'No Content' status code will be used.
 * @param res The response object.
 */
export const emptyResponse = (res: Response): void => {
    // send no content response
    res.sendStatus(StatusCodes.NO_CONTENT);
}

/**
 * Sends an error response.
 * @param res The response object.
 * @param message The error message.
 * @param statusCode The HTTP status code to use. By default, the HTTP status code 500 Internal Server Error is used.
 * @param code The code specifying the error to the frontend.
 * @param trace Stack trace of where the error occurred.
 */
export const errorResponse = (
    res: Response, message: string, statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
    code: string, trace: string|null = null
): void => {
    const response: TErrorResponse = {
        status: statusCode,
        success: false,
        error: {message, code, trace}
    };

    // send the response as json
    res.status(statusCode).json(response);
}

/**
 * Sends a validation response.
 * Automatically sets the HTTP status code to 422 Unprocessable entity.
 * @param res The response object.
 * @param validationErrors The validation errors from class-validator.
 */
export const validationResponse = (res: Response, validationErrors: ZodIssue[]): void => {
    const response: TValidationResponse = {
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        success: false,
        error: {
            message: 'The data did not pass validations.',
            code: 'validation_error',
            trace: null
        },
        validation: validationErrors
    }

    // send the response as json
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
}