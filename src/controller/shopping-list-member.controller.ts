import express, {type Response} from "express";
import {bodyValidator, paramValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";
import {shoppingListDetailParamSchema, type TShoppingListDetailParams} from "../schema/request/shopping-list.schema.ts";
import {
    saveMemberPermissionBodySchema,
    saveMembersBodySchema,
    shoppingListMemberParamSchema,
    type TSaveMemberPermissionBody,
    type TSaveMembersBody,
    type TShoppingListMemberParams
} from "../schema/request/shopping-list-member.schema.ts";
import {successResponse} from "../helper/response.helper.ts";
import {exportShoppingListMembers} from "../utils/shopping-list.utils.ts";
import {StatusCodes} from "http-status-codes";
import {
    addShoppingListMember,
    modifyListMembersPermission,
    removeShoppingListMember
} from "../service/shopping-list-member.service.ts";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListMemberController = express.Router({ mergeParams: true });

/**
 * Adds one or more members to the shopping list.
 */
shoppingListMemberController.post(
    '/', paramValidator(shoppingListDetailParamSchema), bodyValidator(saveMembersBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TSaveMembersBody>, res: Response) => {
        const { id: shoppingListId } = req.parsedParams!;
        const updatedShoppingList = await addShoppingListMember(shoppingListId, req.body, req.user!);

        successResponse(res, { members: await exportShoppingListMembers(updatedShoppingList, true) }, StatusCodes.CREATED);
    }
);

/**
 * Modifies member's permission in the shopping list.
 */
shoppingListMemberController.patch(
    '/:memberId/permission', paramValidator(shoppingListMemberParamSchema), bodyValidator(saveMemberPermissionBodySchema),
    async (req: IAppRequest<TShoppingListMemberParams,never,TSaveMemberPermissionBody>, res: Response) => {
        const { id: shoppingListId, memberId } = req.parsedParams!;
        const updatedShoppingList = await modifyListMembersPermission(
            shoppingListId, memberId, req.body.permission, req.user!
        );

        successResponse(res, { members: await exportShoppingListMembers(updatedShoppingList, true) });
    }
);

/**
 * Removes a member from the shopping list.
 */
shoppingListMemberController.delete(
    '/:memberId', paramValidator(shoppingListMemberParamSchema),
    async (req: IAppRequest<TShoppingListMemberParams>, res: Response) => {
        const { id: shoppingListId, memberId } = req.parsedParams!;
        const updatedShoppingList = await removeShoppingListMember(shoppingListId, memberId, req.user!);

        successResponse(res, { members: await exportShoppingListMembers(updatedShoppingList, true) });
    }
);