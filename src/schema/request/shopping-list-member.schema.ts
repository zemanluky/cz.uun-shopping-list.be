import {shoppingListDetailParamSchema} from "./shopping-list.schema.ts";
import {EShoppingListMemberPermission} from "../db/shopping-list-member.schema.ts";
import {z} from "zod";

// schema for parameters when editing or deleting list member
export const shoppingListMemberParamSchema = shoppingListDetailParamSchema.extend({
    memberId: z.string().trim().min(1)
});
export type TShoppingListMemberParams = z.infer<typeof shoppingListMemberParamSchema>;

const permissionValidator = z.string().trim().toLowerCase().pipe(z.nativeEnum(EShoppingListMemberPermission));

// schema for adding or editing list members
export const saveMembersBodySchema = z.object({
    members: z.array(z.object({
        user: z.string().trim().min(1),
        permission: permissionValidator
    })).min(1),
});
export type TSaveMembersBody = z.infer<typeof saveMembersBodySchema>;

// schema for editing member's permission
export const saveMemberPermissionBodySchema = z.object({
    permission: permissionValidator
});
export type TSaveMemberPermissionBody = z.infer<typeof saveMemberPermissionBodySchema>;