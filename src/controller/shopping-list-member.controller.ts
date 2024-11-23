import express, {type Response} from "express";
import {authenticateRequest} from "../helper/request.guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListMemberController = express.Router({ mergeParams: true });

/**
 * Creates a new item in a given shopping list.
 */
shoppingListMemberController.post(
    '/', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Modifies a given shopping list item.
 */
shoppingListMemberController.put(
    '/:itemId', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Deletes an item from the shopping list.
 */
shoppingListMemberController.delete(
    '/:itemId', paramValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Marks an item as bought.
 */
shoppingListMemberController.patch(
    '/:itemId/completed-status', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);