import {z} from "zod";
import * as mongoose from "mongoose";

/**
 * Converts only allowed values to a boolean. If the value is not a boolean or a string, it returns null.
 * @param value
 */
export const coerceBoolean = (value: any): boolean|null => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return null;
};

/**
 * Custom zod schema for validating object id schemas.
 */
export const zodObjectId = z.custom<string>((value) => mongoose.isValidObjectId(value), { message: 'Invalid ObjectId' });