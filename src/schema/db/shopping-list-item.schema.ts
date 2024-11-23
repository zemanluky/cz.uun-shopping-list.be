import {type InferRawDocType, type Model, Schema, Types} from "mongoose";

export interface IShoppingListItem {
    _id: Types.ObjectId;
    quantity: string;
    name: string;
    completed: {
        completed_by: Types.ObjectId,
        completed_at: Date
    } | null;
}

type TShoppingListItemModel = Model<IShoppingListItem>;

export const shoppingListItemSchema = new Schema<IShoppingListItem, TShoppingListItemModel>({
    quantity: { type: String, required: true },
    name: { type: String, required: true },
    completed: {
        type: {
            completed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            completed_at: { type: Date, required: false }
        },
        required: false,
        default: null
    }
});

export type TShoppingListItem = InferRawDocType<typeof shoppingListItemSchema>;