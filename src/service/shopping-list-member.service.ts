import {Types} from "mongoose";
import type {TSaveMembersBody} from "../schema/request/shopping-list-member.schema.ts";
import type {THydratedUserDocument} from "../schema/db/user.schema.ts";
import {ShoppingList, type THydratedShoppingListDocument} from "../schema/db/shopping-list.schema.ts";
import type {EShoppingListMemberPermission} from "../schema/db/shopping-list-member.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {checkAccessToShoppingList, EShoppingListAccess} from "../utils/shopping-list.utils.ts";
import {PermissionError} from "../error/response/permission.error.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";

/**
 * Adds a new member to a given shopping list.
 * @param shoppingListId ID of the shopping list to add the member to.
 * @param data The member and their permissions.
 * @param user The user who is adding the member (list owner).
 */
export async function addShoppingListMember(
    shoppingListId: Types.ObjectId, data: TSaveMembersBody, user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(
            `Could not find the shopping list with id '${shoppingListId}' to add the member to.`,
            'shopping_list'
        );

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite)
        throw new PermissionError(
            'You are not authorized to add members to this shopping list.',
            'shopping_list.member:add'
        );

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot add members to a closed shopping list.', 'shopping_list.member:closed_list');

    const memberIdsToAdd = shoppingList.members.map(member => member.user.toString());

    if (shoppingList.members.some(existingMember => memberIdsToAdd.includes(existingMember.user.toString())))
        throw new BadRequestError('Cannot add the same member multiple times.', 'shopping_list.member:duplicate');

    data.members.forEach(member => shoppingList.members.push(member));
    return await shoppingList.save();
}

/**
 * Updates a member's permission in a given shopping list.
 * @param shoppingListId ID of the shopping list.
 * @param memberId ID of the member to update.
 * @param permission The new permission to set.
 * @param user The user who is updating the member's permission.
 */
export async function modifyListMembersPermission(
    shoppingListId: Types.ObjectId, memberId: Types.ObjectId, permission: EShoppingListMemberPermission,
    user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(
            `Could not find the shopping list with id '${shoppingListId}' to edit member's permission in.`,
            'shopping_list'
        );

    const access = checkAccessToShoppingList(shoppingList, user);

    if (access !== EShoppingListAccess.ReadWrite)
        throw new PermissionError(
            'You are not authorized to edit members\' permissions in this shopping list.',
            'shopping_list.member:edit_permission'
        );

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot edit members in a closed shopping list.', 'shopping_list.member:closed_list');

    const memberIndex = shoppingList.members.findIndex(member => member.user.equals(memberId));

    if (memberIndex === -1)
        throw new NotFoundError(
            `Could not find the member with id '${memberId}' to update their permissions.`,
            'shopping_list.member'
        );

    shoppingList.members[memberIndex].permission = permission;
    await shoppingList.members[memberIndex].save();

    return await shoppingList.save();
}

/**
 * Removes a member from a given shopping list.
 * @param shoppingListId ID of the shopping list.
 * @param memberId ID of the member to remove.
 * @param user The user who is removing the member.
 */
export async function removeShoppingListMember(
    shoppingListId: Types.ObjectId, memberId: Types.ObjectId, user: THydratedUserDocument
): Promise<THydratedShoppingListDocument> {
    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList)
        throw new NotFoundError(
            `Could not find the shopping list with id '${shoppingListId}' to remove the member from.`,
            'shopping_list'
        );

    const access = checkAccessToShoppingList(shoppingList, user);

    if ([EShoppingListAccess.Read, EShoppingListAccess.ReadAddItems].includes(access)
        || (access !== EShoppingListAccess.ReadWrite && !shoppingList.author.equals(user._id))
    ) {
        throw new PermissionError(
            'You are not authorized to remove members\' from this shopping list.',
            'shopping_list.member:remove'
        );
    }

    if (shoppingList.closed_at !== null)
        throw new BadRequestError('Cannot remove members from a closed shopping list.', 'shopping_list.member:closed_list');

    const memberIndex = shoppingList.members.findIndex(member => member.user.equals(memberId));

    if (memberIndex === -1)
        throw new NotFoundError(
            `Could not find the member with id '${memberId}' to remove them from the list.`,
            'shopping_list.member'
        );

    shoppingList.members[memberIndex].deleteOne();
    return await shoppingList.save();
}