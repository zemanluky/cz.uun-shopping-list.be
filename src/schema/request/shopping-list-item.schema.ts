import {shoppingListDetailParamSchema} from "./shopping-list.schema.ts";
import {z} from "zod";
import {zodObjectId} from "../../utils/validations.utils.ts";
import {Types} from "mongoose";

// schema for parameters when editing or deleting list item
export const shoppingListItemParamSchema = shoppingListDetailParamSchema.extend({
    itemId: z.string().trim().pipe(zodObjectId).transform(val => new Types.ObjectId(val))
});
export type TShoppingListItemParams = z.infer<typeof shoppingListItemParamSchema>;

// schema for adding or editing list item
export const saveItemBodySchema = z.object({
    quantity: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(250),
});
export type TSaveItemBody = z.infer<typeof saveItemBodySchema>;

// schema for marking item as bought
export const markItemBoughtBodySchema = z.object({
    bought: z.boolean()
});
export type TMarkItemBoughtBody = z.infer<typeof markItemBoughtBodySchema>;