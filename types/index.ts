import type {Request} from "express";
import type {THydratedUserDocument} from "../src/schema/db/user.schema.ts";

// application request that can have additional properties set,
// such as the currently logged-in user, parsed parameters and query
export interface IAppRequest<
    TParams = undefined,
    TQuery = undefined,
    TBody = undefined,
    TResBody = any,
    TLocals extends Record<string, any> = Record<string, any>
> extends Request<Record<string,string>,TResBody,TBody extends undefined ? {} : TBody,Record<string,string>,TLocals> {
    parsedParams?: TParams,
    parsedQuery?: TQuery,
    user?: THydratedUserDocument|null
}

/**
 * Parameters used for paginated result sets.
 */
export interface IPaginatedParameters {
    /** Total number of items in the collection. */
    total: number,
    /** Number of items when filtered. */
    filtered: number,
    /** Highest page number. */
    maxPage: number,
    /** Number of items per page. */
    pageSize: number,
    /** Current page number. */
    page: number
}