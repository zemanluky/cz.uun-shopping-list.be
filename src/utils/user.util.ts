import type {IUser, THydratedUserDocument} from "../schema/db/user.schema.ts";
import * as R from "remeda";

export type TUserPublicData = Omit<IUser, 'password'|'profile_picture_path'|'role'|'refresh_tokens'>;

/**
 * Exports user data to be used in responses.
 * @param doc
 */
export function exportUserData(doc: THydratedUserDocument): TUserPublicData {
    return R.omit(doc.toObject(), ['profile_picture_path','refresh_tokens','password','role']);
}