import {shoppingListDetailParamSchema} from "./shopping-list.schema.ts";
import {EShoppingListMemberPermission} from "../db/shopping-list-member.schema.ts";
import {z} from "zod";

// schema for parameters when editing or deleting list member
export const shoppingListMemberParamSchema = shoppingListDetailParamSchema.extend({
    memberId: z.string().trim().min(1)
});
export type TShoppingListMemberParams = z.infer<typeof shoppingListMemberParamSchema>;

// schema for adding or editing list members
export const saveMembersBodySchema = z.object({
    members: z.array(z.object({
        user: z.string().trim().min(1),
        permission: z.nativeEnum(EShoppingListMemberPermission)
    })).min(1),
});
export type TSaveMembersBody = z.infer<typeof saveMembersBodySchema>;