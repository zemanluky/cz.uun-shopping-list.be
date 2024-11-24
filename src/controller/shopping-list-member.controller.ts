import express, {type Response} from "express";
import {authenticateRequest} from "../helper/request.guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";
import {shoppingListDetailParamSchema, type TShoppingListDetailParams} from "../schema/request/shopping-list.schema.ts";
import {
    saveMembersBodySchema,
    shoppingListMemberParamSchema, type TSaveMembersBody,
    type TShoppingListMemberParams
} from "../schema/request/shopping-list-member.schema.ts";
import {successResponse} from "../helper/response.helper.ts";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListMemberController = express.Router({ mergeParams: true });

/**
 * Adds one or more members to the shopping list.
 */
shoppingListMemberController.post(
    '/', paramValidator(shoppingListDetailParamSchema), bodyValidator(saveMembersBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TSaveMembersBody>, res: Response) => {
        successResponse(res, { params: req.parsedParams, body: req.body });
    }
);

/**
 * Modifies member's permission in the shopping list.
 */
shoppingListMemberController.patch(
    '/:memberId/permission', paramValidator(shoppingListMemberParamSchema), bodyValidator(saveMembersBodySchema),
    async (req: IAppRequest<TShoppingListMemberParams,never,TSaveMembersBody>, res: Response) => {
        successResponse(res, { params: req.parsedParams, body: req.body });
    }
);

/**
 * Removes a member from the shopping list.
 */
shoppingListMemberController.delete(
    '/:memberId', paramValidator(shoppingListMemberParamSchema),
    async (req: IAppRequest<TShoppingListMemberParams>, res: Response) => {
        successResponse(res, { params: req.parsedParams });
    }
);