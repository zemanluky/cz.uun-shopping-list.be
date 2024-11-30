import express, {type Response} from "express";
import {bodyValidator, paramValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";
import {
    markItemBoughtBodySchema,
    saveItemBodySchema,
    shoppingListItemParamSchema,
    type TMarkItemBoughtBody,
    type TSaveItemBody,
    type TShoppingListItemParams
} from "../schema/request/shopping-list-item.schema.ts";
import {shoppingListDetailParamSchema, type TShoppingListDetailParams} from "../schema/request/shopping-list.schema.ts";
import {successResponse} from "../helper/response.helper.ts";
import {changeItemCompletionStatus, createItem, deleteItem, updateItem} from "../service/shopping-list-item.service.ts";
import {exportShoppingListItems} from "../utils/shopping-list.utils.ts";
import {StatusCodes} from "http-status-codes";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListItemController = express.Router({ mergeParams: true });

/**
 * Creates a new item in a given shopping list.
 */
shoppingListItemController.post(
    '/', paramValidator(shoppingListDetailParamSchema), bodyValidator(saveItemBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TSaveItemBody>, res: Response) => {
        const { id: shoppingListId } = req.parsedParams!;
        const updatedShoppingList = await createItem(shoppingListId, req.body, req.user!);

        successResponse(res, { items: await exportShoppingListItems(updatedShoppingList) }, StatusCodes.CREATED);
    }
);

/**
 * Modifies a given shopping list item.
 */
shoppingListItemController.put(
    '/:itemId', paramValidator(shoppingListItemParamSchema), bodyValidator(saveItemBodySchema),
    async (req: IAppRequest<TShoppingListItemParams,never,TSaveItemBody>, res: Response) => {
        const { id: shoppingListId, itemId } = req.parsedParams!;
        const updatedShoppingList = await updateItem(shoppingListId, itemId, req.body, req.user!);

        successResponse(res, { items: await exportShoppingListItems(updatedShoppingList) });
    }
);

/**
 * Deletes an item from the shopping list.
 */
shoppingListItemController.delete(
    '/:itemId', paramValidator(shoppingListItemParamSchema),
    async (req: IAppRequest<TShoppingListItemParams>, res: Response) => {
        const { id: shoppingListId, itemId } = req.parsedParams!;
        const updatedShoppingList = await deleteItem(shoppingListId, itemId, req.user!);

        successResponse(res, { items: await exportShoppingListItems(updatedShoppingList) });
    }
);

/**
 * Marks an item as bought.
 */
shoppingListItemController.patch(
    '/:itemId/completed-status', paramValidator(shoppingListItemParamSchema), bodyValidator(markItemBoughtBodySchema),
    async (req: IAppRequest<TShoppingListItemParams,never,TMarkItemBoughtBody>, res: Response) => {
        const { id: shoppingListId, itemId } = req.parsedParams!;
        const updatedShoppingList = await changeItemCompletionStatus(shoppingListId, itemId, req.body.bought, req.user!);

        successResponse(res, { items: await exportShoppingListItems(updatedShoppingList) });
    }
);