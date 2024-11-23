import {paginatedQuerySchema} from "./paginated.schema.ts";
import {z} from "zod";
import {startOfDay} from "date-fns";

export const shoppingListFilterQuerySchema = z.object({
    search: z.string().trim().optional(),
    author: z.string().trim().optional(),
    includeOnly: z.enum(['own', 'shared', 'all']).default('all'),
    completeBy: z.coerce.date().optional()
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