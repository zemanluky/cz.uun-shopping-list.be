import {z} from "zod";

/** Schema that should be used for any paginated endpoint. */
export const paginatedQuerySchema = (defaultPageSize: number = 25) => z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(200).default(defaultPageSize)
});

export type TPaginatedQuery = z.infer<ReturnType<typeof paginatedQuerySchema>>;