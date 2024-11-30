import type {THydratedUserDocument} from "../schema/db/user.schema.ts";
import type {TMarkItemBoughtBody, TSaveItemBody} from "../schema/request/shopping-list-item.schema.ts";
import {Types} from "mongoose";
import {ShoppingList, type THydratedShoppingListDocument} from "../schema/db/shopping-list.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {checkAccessToShoppingList, EShoppingListAccess} from "../utils/shopping-list.utils.ts";
import {PermissionError} from "../error/response/permission.error.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";

/**
 * Creates a new item in a given shopping list.
 * @param shoppingListId ID of the shopping list.
 * @param data The data to create the item with.
 * @param user The user who is creating the item.
 */
export async function createItem(shoppingListId: Types.ObjectId, data: TSaveItemBody, user: THydratedUserDocument): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${shoppingListId}' to add the item to.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite && access !== EShoppingListAccess.ReadAddItems)
        throw new PermissionError('You do not have access to add items to this shopping list.', 'shopping_list.item:add');

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot add items to a list that has been closed.', 'shopping_list.item:closed_list');

    shoppingList.items.push(data);
    return await shoppingList.save();
}

/**
 * Updates a given item in a shopping list.
 * @param shoppingListId ID of the shopping list.
 * @param itemId ID of the item to update.
 * @param data The data to update the item with.
 * @param user The user who is updating the item.
 */
export async function updateItem(
    shoppingListId: Types.ObjectId, itemId: Types.ObjectId, data: TSaveItemBody, user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${shoppingListId}' to edit the item in.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite && access !== EShoppingListAccess.ReadAddItems)
        throw new PermissionError('You do not have access to edit items in this shopping list.', 'shopping_list.item:edit');

    const itemIndex = shoppingList.items.findIndex(item => item._id.equals(itemId));

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot edit items in a list that has been closed.', 'shopping_list.item:closed_list');

    if (itemIndex === -1)
        throw new NotFoundError(`Could not find the shopping list item with id '${itemId}' to update.`, 'shopping_list.item');

    if (shoppingList.items[itemIndex].completed !== null)
        throw new BadRequestError('Cannot update a completed item.', 'shopping_list.item:edit_completed_item');

    const updatedShoppingList = await ShoppingList.findOneAndUpdate({ _id: shoppingListId, 'items._id': itemId }, {
        $set: {
            'items.$.name': data.name,
            'items.$.quantity': data.quantity,
        }
    }, { new: true });

    return updatedShoppingList!;
}

/**
 * Deletes a given item from a given shopping list.
 * @param shoppingListId ID of the shopping list.
 * @param itemId ID of the item to delete.
 * @param user The user who is deleting the item.
 */
export async function deleteItem(
    shoppingListId: Types.ObjectId, itemId: Types.ObjectId, user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${shoppingListId}' to delete the item from.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite && access !== EShoppingListAccess.ReadAddItems)
        throw new PermissionError('You do not have access to delete this resource.', 'shopping_list.item:delete');

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot remove items in a list that has been closed.', 'shopping_list.item:closed_list');

    const itemIndex = shoppingList.items.findIndex(item => item._id.equals(itemId));

    if (itemIndex === -1)
        throw new NotFoundError(`Could not find the shopping list item with id '${itemId}' to delete.`, 'shopping_list.item');

    if (shoppingList.items[itemIndex].completed !== null)
        throw new BadRequestError('Cannot delete a completed item.', 'shopping_list.item:delete_completed_item');

    shoppingList.items[itemIndex].deleteOne();
    return await shoppingList.save();
}

/**
 * Marks a given item as bought or not bought.
 * @param shoppingListId ID of the shopping list.
 * @param itemId ID of the item to mark as bought.
 * @param bought Whether the item is being marked as bought or not.
 * @param user The user who is marking the item as bought.
 */
export async function changeItemCompletionStatus(
    shoppingListId: Types.ObjectId, itemId: Types.ObjectId, bought: boolean, user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(`Could not find the shopping list with id '${shoppingListId}' to delete the item from.`, 'shopping_list');

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access === EShoppingListAccess.None)
        throw new PermissionError('You do not have access to update this resource.', 'shopping_list.item:change_status');

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot edit items in a list that has been closed.', 'shopping_list.item:closed_list');

    const itemIndex = shoppingList.items.findIndex(item => item._id.equals(itemId));

    if (itemIndex === -1)
        throw new NotFoundError(`Could not find the shopping list item with id '${itemId}' to change status of.`, 'shopping_list.item');

    // if the item is already in the desired state, just return the detail of the shopping list
    if ((shoppingList.items[itemIndex].completed === null && !bought) || (shoppingList.items[itemIndex].completed !== null && bought))
        return shoppingList;

    shoppingList.items[itemIndex].completed = bought ? {
        completed_at: new Date(),
        completed_by: user._id
    } : null;
    shoppingList.items[itemIndex].save();

    shoppingList.updated_at = new Date();

    return await shoppingList.save();
}