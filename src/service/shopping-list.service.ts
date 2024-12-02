import type {
    TShoppingListBody,
    TShoppingListListQuery,
    TUpdateShoppingListBody
} from "../schema/request/shopping-list.schema.ts";
import {ShoppingList, type THydratedShoppingListDocument} from "../schema/db/shopping-list.schema.ts";
import {EUserRole, type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {Types} from "mongoose";
import type {IPaginatedParameters} from "../../types";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {checkAccessToShoppingList, EShoppingListAccess} from "../utils/shopping-list.utils.ts";
import {PermissionError} from "../error/response/permission.error.ts";
import {validatePaginationParameters} from "../utils/pagination.utils.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";

type TShoppingListListResult = { shoppingLists: Array<THydratedShoppingListDocument>, paginatedParams: IPaginatedParameters };

/**
 * Gets a paginated list of shopping lists available to the logged-in user.
 * Additionally, when provided with filter, the result set can be filtered and the results set may be offset.
 * @param user
 * @param filter
 */
export async function listShoppingLists(user: THydratedUserDocument, filter: TShoppingListListQuery): Promise<TShoppingListListResult> {
    const {page, pageSize, includeOnly, includeCompleted, completeBy, search, author} = filter;

    const baseQuery = ShoppingList.find();

    // filter the results the logged-in user has access to
    if (author !== undefined) {
        // when the logged-in user is an admin, they can see any list, so we just filter out list of the given author
        if (user.role === EUserRole.Admin || user._id.equals(author)) {
            baseQuery.where({ author: author });
        }
        else {
            baseQuery.and([
                { author: author },
                { 'members.user': user._id }
            ]);
        }
    }
    else if (includeOnly === 'all' && user.role !== EUserRole.Admin) {
        // find user's own lists and lists shared with them
        // if the user is an admin, they can see all lists, no need to filter
        baseQuery.or([
            { author: user._id },
            { 'members.user': user._id }
        ]);
    }
    else if (includeOnly === 'own') {
        // find only user's own lists
        baseQuery.where({ author: user._id });
    }
    else if (includeOnly === 'shared') {
        // find only lists shared with the user
        // when the user is an admin, they can see all lists, so we filter out their own lists
        if (user.role === EUserRole.Admin) {
            baseQuery.where({ author: { $ne: user._id } })
        }
        // otherwise we find lists shared with the user
        else {
            baseQuery.where({ 'members.user': user._id });
        }
    }

    // when we don't want completed lists, we filter lists that don't have a set closed_at attribute
    if (!includeCompleted) baseQuery.where({ closed_at: null });

    // search only for lists before a given completion date
    if (completeBy !== undefined) baseQuery.where({ complete_by: { $lte: completeBy } });

    // search for lists by name
    if (search !== undefined) baseQuery.where({ name: new RegExp(`${search}`, 'i') });

    const { validatedPageSize, validatedPage, skipDocuments } = validatePaginationParameters(page, pageSize);

    const queryResults = await baseQuery
        .collation({ locale: 'en', strength: 1 })
        .sort({ created_at: 1, complete_by: 1 })
        .limit(validatedPageSize)
        .skip(skipDocuments)
        .exec();

    return {
        shoppingLists: queryResults,
        paginatedParams: {
            total: await ShoppingList.collection.countDocuments(),
            filtered: queryResults.length,
            pageSize: validatedPageSize,
            maxPage: queryResults.length > 0
                ? Math.ceil(queryResults.length / validatedPageSize)
                : 1,
            page: validatedPage
        }
    };
}

/**
 * Gets a list of shopping lists available to the logged-in user.
 * @param id
 * @param user
 */
export async function getShoppingListDetail(id: Types.ObjectId, user: THydratedUserDocument): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList) throw new NotFoundError(`Could not find shopping list with id '${id}'.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access === EShoppingListAccess.None)
        throw new PermissionError(`You do not have access to this resource.`, 'shopping_list:read');

    return shoppingList;
}

/**
 * Creates a new shopping list for a given user.
 * @param data The validated data to create the shopping list from.
 * @param user The user who is creating the shopping list.
 * @return The created shopping list document.
 */
export async function createShoppingList(data: TShoppingListBody, user: THydratedUserDocument): Promise<THydratedShoppingListDocument> {
    const shoppingList = new ShoppingList({...data, author: user._id});
    return await shoppingList.save();
}

/**
 * Updates a shopping list with the given data.
 * @return The updated shopping list document.
 */
export async function updateShoppingList(id: Types.ObjectId, data: TUpdateShoppingListBody, user: THydratedUserDocument): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${id}' to edit.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite)
        throw new PermissionError('You do not have access to edit this resource.', 'shopping_list:write');

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot update a closed shopping list.', 'shopping_list:edit_closed_list');

    const {name, complete_by} = data;

    shoppingList.name = name;
    shoppingList.updated_at = new Date();

    if (complete_by !== undefined)
        shoppingList.complete_by = complete_by;

    return await shoppingList.save();
}

/**
 * Closes a given shopping list.
 * @param id
 * @param user
 */
export async function closeShoppingList(id: Types.ObjectId, user: THydratedUserDocument): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${id}' to edit.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite)
        throw new PermissionError('You do not have access to edit this resource.', 'shopping_list:write');

    // mark all incomplete items as complete now and set the close_at attribute
    const result = await ShoppingList.findOneAndUpdate({ _id: id, 'items.completed': null }, {
        $set: {
            "items.$[].completed": {
                completed_at: new Date(),
                completed_by: user._id
            },
            closed_at: new Date()
        }
    }, { new: true });

    return result!;
}

/**
 * Deletes a given shopping list.
 * @param id
 * @param user
 */
export async function deleteShoppingList(id: Types.ObjectId, user: THydratedUserDocument): Promise<void> {
    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${id}' to delete.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite)
        throw new PermissionError('You do not have access to delete this resource.', 'shopping_list:delete');

    await shoppingList.deleteOne();
}