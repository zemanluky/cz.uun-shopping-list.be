import {EUserRole, type THydratedUserDocument} from "../schema/db/user.schema.ts";
import type {IShoppingList, THydratedShoppingListDocument} from "../schema/db/shopping-list.schema.ts";
import {EShoppingListMemberPermission, type IShoppingListMember} from "../schema/db/shopping-list-member.schema.ts";
import {exportUserData, type TUserPublicData} from "./user.util.ts";
import * as R from "remeda";
import type {IShoppingListItem} from "../schema/db/shopping-list-item.schema.ts";
import {Types} from "mongoose";

export enum EShoppingListAccess {
    None,
    Read,
    ReadWrite,
    ReadAddItems,
}

/**
 * Checks what access a given user has to a given shopping list.
 * @param shoppingList The shopping list to check access to.
 * @param user The user to check access for.
 */
export function checkAccessToShoppingList(shoppingList: THydratedShoppingListDocument, user: THydratedUserDocument): EShoppingListAccess {
    console.log(user._id, shoppingList.author);

    if (user.role === EUserRole.Admin || user._id.equals(shoppingList.author))
        return EShoppingListAccess.ReadWrite;

    const member = shoppingList.members.find(member => member.user.equals(user._id));

    if (member)
        return member.permission === EShoppingListMemberPermission.read
            ? EShoppingListAccess.Read
            : EShoppingListAccess.ReadAddItems
        ;

    return EShoppingListAccess.None;
}

export type TShoppingListOverview = Omit<IShoppingList, 'photo_upload_path'|'members'|'items'|'author'> & {
    author: TUserPublicData,
    has_photo: boolean;
};

/**
 * Exports a shopping list's document to be used in list responses.
 * @param doc The document to export.
 */
export async function exportShoppingListOverview(doc: THydratedShoppingListDocument): Promise<TShoppingListOverview> {
    const populatedDoc = await doc.populate<{author: THydratedUserDocument}>('author');
    const documentProperties = R.omit(
        populatedDoc.toObject(),
        ['photo_upload_path', 'author', 'members', 'items']
    );

    return {
        ...documentProperties,
        author: exportUserData(populatedDoc.author),
        has_photo: populatedDoc.photo_upload_path !== null
    }
}

export type TShoppingListDetail<TIncludeMemberPermission extends boolean|undefined = undefined> = TShoppingListOverview & {
    members: Array<TMemberExportData<TIncludeMemberPermission>>,
    items: TItemsExport
}

/**
 * Exports a shopping list's document to be used in detail responses.
 * @param doc The document to export.
 * @param includeMemberPermissions Whether member permissions should be included in the export.
 */
export async function exportShoppingListDetail<TIncludeMemberPermission extends boolean|undefined = undefined>(
    doc: THydratedShoppingListDocument, includeMemberPermissions?: TIncludeMemberPermission
): Promise<TShoppingListDetail<TIncludeMemberPermission>> {
    const overviewData = await exportShoppingListOverview(doc);

    return {
        ...overviewData,
        members: await exportShoppingListMembers(doc, includeMemberPermissions),
        items: await exportShoppingListItems(doc)
    }
}

export type TShoppingListItemStatistics = {
    total_items: number;
    completed_items: number;
};

/**
 * Exports shopping list item statistics for a given document.
 * @param doc The document to get the statistics from.
 */
export function exportShoppingListItemStatistics(doc: THydratedShoppingListDocument): { stats: TShoppingListItemStatistics } {
    return {
        stats: {
            total_items: doc.items.length,
            completed_items: doc.items.filter(item => item.completed !== null).length
        }
    };
}

type TPopulatedItemsShoppingListDocument = Omit<THydratedShoppingListDocument, 'items'> & {
    items: Types.DocumentArray<Omit<IShoppingListItem, 'completed'> & {
        completed: {
            completed_at: Date,
            completed_by: THydratedUserDocument
        } | null
    }>
}

type TItemsExport = Array<Omit<IShoppingListItem, 'completed'> & {
    completed: {
        completed_at: Date,
        completed_by: TUserPublicData
    } | null
}>;

/**
 * Exports shopping list items to be used in responses.
 * @param doc
 */
export async function exportShoppingListItems(doc: THydratedShoppingListDocument): Promise<TItemsExport> {
    const populatedDoc = await doc.populate<TPopulatedItemsShoppingListDocument>('items.completed.completed_by');

    return populatedDoc.items.map(item => {
        const data = item.toObject();

        return {
            ...data,
            completed: data.completed !== null ? {
                ...data.completed,
                completed_by: exportUserData(item.completed?.completed_by!)
            } : null
        }
    });
}

type TPopulatedMembersShoppingListDocument = Omit<THydratedShoppingListDocument, 'members'> & {
    members: Types.DocumentArray<Omit<IShoppingListMember, 'user'> & {
        user: THydratedUserDocument
    }>
}

type TMemberExportData<TIncludeMemberPermission extends boolean|undefined = undefined> = TIncludeMemberPermission extends true
    ? { user: TUserPublicData, permission: EShoppingListMemberPermission }
    : { user: TUserPublicData }
;

/**
 * Exports shopping list members array that may be used in responses.
 * @param doc The shopping list document to export members from.
 * @param includeMemberPermissions Whether member's permission property should be included in the export.
 */
export async function exportShoppingListMembers<TIncludeMemberPermission extends boolean|undefined = undefined>(
    doc: THydratedShoppingListDocument, includeMemberPermissions?: TIncludeMemberPermission
): Promise<Array<TMemberExportData<TIncludeMemberPermission>>> {
    const populatedDoc = await doc.populate<TPopulatedMembersShoppingListDocument>('members.user');

    return populatedDoc.members.map(member => {
        const data = { user: exportUserData(member.user) };

        if (!includeMemberPermissions) return data;

        return {
            ...data,
            permission: member.permission
        };
    }) as Array<TMemberExportData<TIncludeMemberPermission>>;
}