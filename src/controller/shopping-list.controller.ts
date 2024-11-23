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

export const shoppingListController = express.Router();

/**
 * Gets list of shopping lists available to the logged-in user.
 * Allows for filtering.
 */
shoppingListController.get(
    '/', queryValidator(shoppingListListQuerySchema),
    async (req: IAppRequest<never,TShoppingListListQuery>, res: Response) => {

    }
);

/**
 * Gets a detail of a given shopping list.
 */
shoppingListController.get(
    '/:id', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {

    }
);

/**
 * Creates a new shopping list.
 */
shoppingListController.post(
    '/', bodyValidator(shoppingListBodySchema),
    async (req: IAppRequest<never,never,TShoppingListBody>, res: Response) => {

    }
);

/**
 * Updates a shopping list.
 */
shoppingListController.put(
    '/:id', paramValidator(shoppingListDetailParamSchema), bodyValidator(updateShoppingListBodySchema),
    async (req: IAppRequest<TShoppingListDetailParams,never,TUpdateShoppingListBody>, res: Response) => {

    }
);

/**
 * Deletes a shopping list.
 */
shoppingListController.delete(
    '/:id', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {

    }
);

/**
 * Marks the shopping list as completed.
 */
shoppingListController.patch(
    '/:id/completed-status', paramValidator(shoppingListDetailParamSchema),
    async (req: IAppRequest<TShoppingListDetailParams>, res: Response) => {

    }
);