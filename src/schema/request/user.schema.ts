import {z} from "zod";
import {paginatedQuerySchema} from "./paginated.schema.ts";

const usernameValidator = z.string()
    .toLowerCase()
    .trim()
    .min(5)
    .regex(/^[a-z_-]+$/gm);

const userListSearchSchema = z.object({
    search: z.string().optional(),
    searchByUsername: z.string().optional()
});

export const userListQuerySchema = paginatedQuerySchema()
    .merge(userListSearchSchema)
    .refine(
        ({search, searchByUsername}) => search === undefined || searchByUsername === undefined,
        'Only search or search by username may be provided.'
    );
;
export type TUserListQuery = z.infer<typeof userListQuerySchema>;

export const getUserParamSchema = z.object({ id: z.string() });
export const getUserQuerySchema = z.object({ filter_type: z.enum(['id', 'username']).default('id') });
export type TUserDetailParams = z.infer<typeof getUserParamSchema>;
export type TUserDetailQuery = z.infer<typeof getUserQuerySchema>;

export const registerUserBodySchema = z.object({
    name: z.string().trim().min(1),
    surname: z.string().trim().min(1),
    username: usernameValidator,
    email: z.string().email(),
    password: z.string()
        .trim()
        .regex(/^(?=(.*[a-z])+)(?=(.*[A-Z])+)(?=(.*[0-9])+)(?=(.*[!"#$%&'()*+,-.\/:;<=>?@[\]^_`{|}~])+).{8,72}$/gm)
});
export const updateUserSchema = registerUserBodySchema.omit({ password: true });
export type TRegisterUserData = z.infer<typeof registerUserBodySchema>;
export type TUpdateUserData = z.infer<typeof updateUserSchema>;

export const getRegistrationAvailabilityQuerySchema = z.object({
    email: z.string().email(),
    username: usernameValidator,
}).partial();
export type TRegistrationAvailabilityQuery = z.infer<typeof getRegistrationAvailabilityQuerySchema>;