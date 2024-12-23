import express, {type Response} from "express";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import {
    getRegistrationAvailabilityQuerySchema, getUserParamSchema, registerUserBodySchema,
    type TRegisterUserData, type TRegistrationAvailabilityQuery, type TUpdateUserData, type TUserListQuery,
    type TUserDetailParams, updateUserSchema, userListQuerySchema, type TUserDetailQuery, getUserQuerySchema
} from "../schema/request/user.schema.ts";
import {authenticateRequest} from "../helper/request.guard.ts";
import {
    checkIdentifierAvailability, createUser, getUserDetailById, getUserDetailByUsername, getUserList, updateUser
} from "../service/user.service.ts";
import {emptyResponse, paginatedResponse, successResponse} from "../helper/response.helper.ts";
import {exportUserData} from "../utils/user.util.ts";
import type {IAppRequest} from "../../types";

export const userController = express.Router();

/**
 * Gets a list of users available in the application.
 * It also allows to search the users by a given query.
 */
userController.get(
    '/', authenticateRequest(), queryValidator(userListQuerySchema),
    async (req: IAppRequest<never,TUserListQuery>, res: Response) => {
        const { users, paginatedParams } = await getUserList(req.parsedQuery);
        const publicUsers = users.map(u => exportUserData(u));

        paginatedResponse(res, publicUsers, paginatedParams);
    }
);

/**
 * Gets a detailed profile about a given user.
 */
userController.get(
    '/:id',
    authenticateRequest(), paramValidator(getUserParamSchema), queryValidator(getUserQuerySchema),
    async (req: IAppRequest<TUserDetailParams,TUserDetailQuery>, res: Response) => {
        // we want to get user by their username
        if (req.parsedQuery!.filter_type === 'username') {
            const user = await getUserDetailByUsername(req.parsedParams!.id);
            return successResponse(res, exportUserData(user));
        }

        const user = await getUserDetailById(req.parsedParams!.id);
        successResponse(res, exportUserData(user));
    }
)

/**
 * Registers new user to the application.
 */
userController.post(
    '/registration',
    bodyValidator(registerUserBodySchema),
    async (req: IAppRequest<never,never,TRegisterUserData>, res: Response) => {
        // create the user
        await createUser(req.body);
        emptyResponse(res);
    }
);

/**
 * Checks unique values, such as email and username, for availability.
 */
userController.get(
    '/registration/availability',
    queryValidator(getRegistrationAvailabilityQuerySchema),
    async (req: IAppRequest<never,TRegistrationAvailabilityQuery>, res: Response) => {
        const availabilities = await checkIdentifierAvailability(req.query);
        successResponse(res, availabilities);
    }
);

/**
 * Updates user's own profile information.
 */
userController.put(
    '/profile',
    authenticateRequest(), bodyValidator(updateUserSchema),
    async (req: IAppRequest<never,never,TUpdateUserData>, res: Response) => {
        // update user own data (use authenticated user's id) and return their updated data
        const updatedUser = await updateUser(req.body, req.user!._id.toString());
        successResponse(res, exportUserData(updatedUser));
    }
);