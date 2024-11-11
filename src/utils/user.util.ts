import type {IUser, THydratedUserDocument} from "../schema/db/user.schema.ts";
import * as R from "remeda";

export function publicUserData(data: THydratedUserDocument): Omit<IUser, 'password'|'profile_picture_path'|'role'|'refresh_tokens'> {
    return R.omit(data.toObject(), ['profile_picture_path','refresh_tokens','password','role']);
}