import {type HydratedDocument, type InferRawDocType, model, type Model, Schema, Types} from "mongoose";
import {type IUserRefreshToken, userRefreshTokenSchema} from "./user-refresh-token.schema.ts";

export enum EUserRole {
    Admin = 'admin',
    User = 'user'
}

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    surname: string;
    username: string;
    profile_picture_path: string|null;
    email: string;
    password: string;
    role: EUserRole;
    refresh_tokens: Array<IUserRefreshToken>;
}

interface IUserMethods {
    fullName: () => string
}

export type THydratedUserDocument = HydratedDocument<IUser & { refresh_tokens?: Types.DocumentArray<IUserRefreshToken> }>;

type TUserModel = Model<IUser, {}, IUserMethods, {}, THydratedUserDocument>

const userSchema = new Schema<IUser, TUserModel, IUserMethods>({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    username: { type: String, required: true, index: true, unique: true },
    profile_picture_path: { type: String, required: false, default: null },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: false, default: EUserRole.User },
    refresh_tokens: { type: [userRefreshTokenSchema], default: [] },
});
userSchema.method('fullName', function fullName() {
    return `${this.name} ${this.surname}`;
});

userSchema.index({ "refresh_tokens.jti": 1 }, { unique: true, sparse: true });
userSchema.index({ "refresh_tokens.issued_at": 1 }, { sparse: true });

export const User = model<IUser, TUserModel>('User', userSchema);
export type TUser = InferRawDocType<typeof userSchema>;