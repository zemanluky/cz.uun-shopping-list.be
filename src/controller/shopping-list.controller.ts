import express, {type Response} from "express";
import {authenticateRequest} from "../helper/request.guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";
import {
    shoppingListBodySchema,
    shoppingListDetailParamSchema,
    shoppingListListQuerySchema, type TShoppingListBody, type TShoppingListDetailParams,
    type TShoppingListListQuery, type TUpdateShoppingListBody, updateShoppingListBodySchema
} from "../schema/request/shopping-list.schema.ts";
import {emptyResponse, paginatedResponse, successResponse} from "../helper/response.helper.ts";
import {
    closeShoppingList,
    createShoppingList, deleteShoppingList,
    getShoppingListDetail,
    listShoppingLists,
    updateShoppingList
} from "../service/shopping-list.service.ts";
import {
    checkAccessToShoppingList,
    EShoppingListAccess,
    exportShoppingListDetail, exportShoppingListItemStatistics, exportShoppingListOverview
} from "../utils/shopping-list.utils.ts";

export const shoppingListController = express.Router();

/**
 * Gets list of shopping lists available to the logged-in user.
 * Allows for filtering.
 */
shoppingListController.get(
    '/', queryValidator(shoppingListListQuerySchema),
    async (req: IAppRequest<never,TShoppingListListQuery>, res: Response) => {
        const { shoppingLists, paginatedParams } = await listShoppingLists(req.user!, req.parsedQuery!);

        // make the data publicly usable
        const exportedShoppingLists = await Promise.all(shoppingLists.map(async list => ({
            ...(await exportShoppingListOverview(list)),
            ...exportShoppingListItemStatistics(list),
        })));

        paginatedResponse(res, exportedShoppingLists, paginatedParams);
    }
);

/**
 * Gets a detail of a given shopping list.
 */
shoppingListController.get(
    '/:id', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {
        const objectId = req.parsedParams!.id;
        const shoppingList = await getShoppingListDetail(objectId, req.user!);
        const permission = checkAccessToShoppingList(shoppingList, req.user!);

        const data = {
            ...(await exportShoppingListDetail(shoppingList, permission === EShoppingListAccess.ReadWrite)),
            ...exportShoppingListItemStatistics(shoppingList),
        }

        successResponse(res, data);
    }
);

/**
 * Creates a new shopping list.
 */
shoppingListController.post(
    '/', bodyValidator(shoppingListBodySchema),
    async (req: IAppRequest<never,never,TShoppingListBody>, res: Response) => {
        const shoppingList = await createShoppingList(req.body, req.user!);

        const data = {
            ...(await exportShoppingListDetail(shoppingList, true)),
            ...exportShoppingListItemStatistics(shoppingList),
        }

        successResponse(res, data);
    }
);

/**
 * Updates a shopping list.
 */
shoppingListController.put(
    '/:id', paramValidator(shoppingListDetailParamSchema), bodyValidator(updateShoppingListBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TUpdateShoppingListBody>, res: Response) => {
        const objectId = req.parsedParams!.id;
        const shoppingList = await updateShoppingList(objectId, req.body, req.user!);

        const data = {
            ...(await exportShoppingListDetail(shoppingList, true)),
            ...exportShoppingListItemStatistics(shoppingList),
        }

        successResponse(res, data);
    }
);

/**
 * Deletes a shopping list.
 */
shoppingListController.delete(
    '/:id', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {
        const objectId = req.parsedParams!.id;
        await deleteShoppingList(objectId, req.user!);

        emptyResponse(res);
    }
);

/**
 * Marks the shopping list as completed.
 */
shoppingListController.patch(
    '/:id/completed-status', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {
        const objectId = req.parsedParams!.id;
        const shoppingList = await closeShoppingList(objectId, req.user!);

        const data = {
            ...(await exportShoppingListDetail(shoppingList, true)),
            ...exportShoppingListItemStatistics(shoppingList),
        }

        successResponse(res, data);
    }
);