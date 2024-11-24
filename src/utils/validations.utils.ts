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