import express, {type Response} from "express";
import {authenticateRequest} from "../helper/request.guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";

export const shoppingListController = express.Router();

/**
 * Gets list of shopping lists available to the logged-in user.
 * Allows for filtering.
 */
shoppingListController.get(
    '/', queryValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Gets a detail of a given shopping list.
 */
shoppingListController.get(
    '/:id', paramValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Creates a new shopping list.
 */
shoppingListController.post(
    '/', bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Updates a shopping list.
 */
shoppingListController.put(
    '/:id', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Deletes a shopping list.
 */
shoppingListController.delete(
    '/:id', paramValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Marks the shopping list as completed.
 */
shoppingListController.patch(
    '/:id/completed-status', paramValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);