import {type InferRawDocType, type Model, Schema, Types} from "mongoose";

export enum EShoppingListMemberPermission {
    read = 'read',
    write = 'write'
}

export interface IShoppingListMember {
    _id: Types.ObjectId;
    permission: EShoppingListMemberPermission;
    user: Types.ObjectId;
}

type TShoppingListMemberModel = Model<IShoppingListMember>;

export const shoppingListMemberSchema = new Schema<IShoppingListMember, TShoppingListMemberModel>({
    permission: { type: String, required: true, enum: Object.values(EShoppingListMemberPermission), default: EShoppingListMemberPermission.read },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
});

export type TShoppingMemberItem = InferRawDocType<typeof shoppingListMemberSchema>;