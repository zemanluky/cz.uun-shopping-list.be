import express, {type Response} from "express";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";
import {
    markItemBoughtBodySchema,
    saveItemBodySchema,
    shoppingListItemParamSchema, type TMarkItemBoughtBody, type TSaveItemBody,
    type TShoppingListItemParams
} from "../schema/request/shopping-list-item.schema.ts";
import {shoppingListDetailParamSchema, type TShoppingListDetailParams} from "../schema/request/shopping-list.schema.ts";
import {successResponse} from "../helper/response.helper.ts";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListItemController = express.Router({ mergeParams: true });

/**
 * Creates a new item in a given shopping list.
 */
shoppingListItemController.post(
    '/', paramValidator(shoppingListDetailParamSchema), bodyValidator(saveItemBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TSaveItemBody>, res: Response) => {
        successResponse(res, { params: req.parsedParams, body: req.body });
    }
);

/**
 * Modifies a given shopping list item.
 */
shoppingListItemController.put(
    '/:itemId', paramValidator(shoppingListItemParamSchema), bodyValidator(saveItemBodySchema),
    async (req: IAppRequest<TShoppingListItemParams,never,TSaveItemBody>, res: Response) => {
        successResponse(res, { params: req.parsedParams, body: req.body });
    }
);

/**
 * Deletes an item from the shopping list.
 */
shoppingListItemController.delete(
    '/:itemId', paramValidator(shoppingListItemParamSchema),
    async (req: IAppRequest<TShoppingListItemParams>, res: Response) => {
        successResponse(res, { params: req.parsedParams });
    }
);

/**
 * Marks an item as bought.
 */
shoppingListItemController.patch(
    '/:itemId/completed-status', paramValidator(shoppingListItemParamSchema), bodyValidator(markItemBoughtBodySchema),
    async (req: IAppRequest<TShoppingListItemParams,never,TMarkItemBoughtBody>, res: Response) => {
        successResponse(res, { params: req.parsedParams, body: req.body });
    }
);