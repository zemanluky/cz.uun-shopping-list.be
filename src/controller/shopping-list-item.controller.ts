import express, {type Response} from "express";
import {authenticateRequest} from "../helper/request.guard.ts";
import {bodyValidator, paramValidator, queryValidator} from "../helper/request.validator.ts";
import type {IAppRequest} from "../../types";

// should be mounted already on a route containing the id parameter of the shopping list - we have to merge the parameters
export const shoppingListItemController = express.Router({ mergeParams: true });

/**
 * Adds one or more members to the shopping list.
 */
shoppingListItemController.post(
    '/', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Modifies member's permission in the shopping list.
 */
shoppingListItemController.patch(
    '/:memberId/permission', paramValidator(), bodyValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);

/**
 * Removes a member from the shopping list.
 */
shoppingListItemController.delete(
    '/:memberId', paramValidator(),
    async (req: IAppRequest, res: Response) => {

    }
);