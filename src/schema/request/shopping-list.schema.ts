import {paginatedQuerySchema} from "./paginated.schema.ts";
import {z} from "zod";
import {startOfDay} from "date-fns";
import {coerceBoolean} from "../../utils/validations.utils.ts";

export const shoppingListFilterQuerySchema = z.object({
    // searches for shopping lists by name
    search: z.string().trim().optional(),
    // searches for shopping lists of a given author
    author: z.string().trim().optional(),
    // searches for shopping lists that the user either owns, has access to or both
    includeOnly: z.string().toLowerCase().trim().pipe(z.enum(['own', 'shared', 'all'])).default('all'),
    // searches for shopping lists before a given completion date
    completeBy: z.coerce.date().optional(),
    // includes shopping lists that are completed
    includeCompleted: z.preprocess(coerceBoolean, z.boolean()).default(false)
});

// filter schema for querying shopping lists
export const shoppingListListQuerySchema = paginatedQuerySchema().merge(shoppingListFilterQuerySchema);
export type TShoppingListListQuery = z.infer<typeof shoppingListListQuerySchema>;

// detail parameter schema
export const shoppingListDetailParamSchema = z.object({ id: z.string().trim() });
export type TShoppingListDetailParams = z.infer<typeof shoppingListDetailParamSchema>;

const completeBySchema = z.coerce.date().min(startOfDay(new Date()));

// shopping list schema
export const shoppingListBodySchema = z.object({
    name: z.string().trim().min(3).max(300),
    complete_by: completeBySchema
});
export type TShoppingListBody = z.infer<typeof shoppingListBodySchema>;

// update shopping list schema without required date (may stay the same)
export const updateShoppingListBodySchema = shoppingListBodySchema.extend({ complete_by: completeBySchema.optional() });
export type TUpdateShoppingListBody = z.infer<typeof updateShoppingListBodySchema>;