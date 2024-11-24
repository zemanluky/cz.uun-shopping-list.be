import {type HydratedDocument, type InferRawDocType, model, type Model, Schema, Types} from "mongoose";
import {type IShoppingListItem, shoppingListItemSchema} from "./shopping-list-item.schema.ts";

export interface IShoppingList {
    _id: Types.ObjectId;
    name: string;
    photo_upload_path: string|null;
    author: Types.ObjectId;
    items: Array<IShoppingListItem>;
    members: Array<Types.ObjectId>;
    created_at: Date;
    updated_at: Date;
    complete_by: Date;
    closed_at: Date|null;
}

export type THydratedShoppingListDocument = HydratedDocument<IShoppingList & { items?: Types.DocumentArray<IShoppingListItem> }>;
type TShoppingListModel = Model<IShoppingList,{},{},{},THydratedShoppingListDocument>

const shoppingListSchema = new Schema<IShoppingList, TShoppingListModel>({
    name: { type: String, required: true, index: "text" },
    photo_upload_path: { type: String, required: false, default: null },
    author: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    items: { type: [shoppingListItemSchema], required: true, default: [] },
    members: { type: [{type: Schema.Types.ObjectId, ref: 'User'}], default: [], required: true },
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    complete_by: { type: Date, required: true },
    closed_at: { type: Date, required: false, default: null }
});
shoppingListSchema.index({ created_at: 1, complete_by: 1 });

export const ShoppingList = model<IShoppingList, TShoppingListModel>('ShoppingList', shoppingListSchema);
export type TShoppingList = InferRawDocType<typeof shoppingListSchema>;