import {clamp} from "remeda";

type TValidatedPaginationParameters = {
    validatedPage: number;
    validatedPageSize: number;
    skipDocuments: number;
}

/**
 * Validates the given pagination parameters and returns clamped values, with calculated offset.
 * @param page
 * @param pageSize
 * @param max The maximum allowed page size. By default, it is 200 documents.
 */
export function validatePaginationParameters(page: number, pageSize: number, max: number = 200): TValidatedPaginationParameters {
    const validatedPage = Math.max(1, page);
    const validatedPageSize = clamp(pageSize, { min: 1, max: max });
    const skipDocuments = (validatedPage - 1) * validatedPageSize;

    return { validatedPage, validatedPageSize, skipDocuments };
}