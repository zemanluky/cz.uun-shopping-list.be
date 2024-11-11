import type {
    TRegisterUserData,
    TRegistrationAvailabilityQuery,
    TUpdateUserData
} from "../schema/request/user.schema.ts";
import {type THydratedUserDocument, User} from "../schema/db/user.schema.ts";
import {NotFoundError} from "../error/response/not-found.error.ts";
import {BadRequestError} from "../error/response/bad-request.error.ts";
import {mongo, Types} from "mongoose";

/**
 * Gets detail of a given user based on the provided ID.
 * @param id
 */
export async function getUserDetailById(id: string): Promise<THydratedUserDocument> {
    const user = await User.findById(id);

    if (!user) throw new NotFoundError(`Could not find user with id '${id}'.`, 'user');

    return user;
}

/**
 * Gets detail of a given user based on provided username.
 * @param username
 */
export async function getUserDetailByUsername(username: string): Promise<THydratedUserDocument> {
    const user = await User.findOne({ username });

    if (!user) throw new NotFoundError(`Could not find user with username '${username}'.`, 'user');

    return user;
}

type TIdentifierAvailability = {
    email?: boolean;
    username?: boolean;
};

/**
 * Checks availability of unique user properties, such as email and username.
 * @param data The data to check.
 * @param ignoreUserId Ignores user with the given ID. May be useful when checking for identification availability for
 *                     an existing user (as they can have their own email.)
 * @return object containing availabilities.
 */
export async function checkIdentifierAvailability(
    data: TRegistrationAvailabilityQuery, ignoreUserId?: string
): Promise<TIdentifierAvailability> {
    const availabilities: TIdentifierAvailability = {};

    if (data.email !== undefined) {
        const exists = await User.exists({
            email: data.email,
            ...(ignoreUserId ? { _id: { $ne: new mongo.ObjectId(ignoreUserId) }} : {})
        });
        availabilities.email = exists === null; // when null it means no user with the given email exists.
    }

    if (data.username !== undefined) {
        const exists = await User.exists({
            username: data.username,
            ...(ignoreUserId ? { _id: { $ne: new mongo.ObjectId(ignoreUserId) }} : {})
        });
        availabilities.username = exists === null;
    }

    return availabilities;
}

/**
 * Creates new user from given data.
 * @param data
 * @return Created user document.
 */
export async function createUser(data: TRegisterUserData): Promise<THydratedUserDocument> {
    // let's first verify that the user can use the specified email and username
    const availability = await User.exists({ $or: [{ email: data.email }, { username: data.email }] });

    if (availability !== null)
        throw new BadRequestError('Cannot create new user with existing credentials.', 'duplicate_credentials');

    // save the data
    const {name,surname,username,email,password} = data;

    const passHash = await Bun.password.hash(password);
    const user = new User({
        name, surname, username, email,
        password: passHash
    });

    return await user.save();
}

/**
 * Updates user data of a given user by their ID.
 * @param data The data used for the update.
 * @param id ID of the user.
 */
export async function updateUser(data: TUpdateUserData, id: string): Promise<THydratedUserDocument> {
    // first let's retrieve the existing user
    const user = await User.findById(id);

    if (!user)
        throw new BadRequestError('Trying to update user that does not exist.', 'updating_missing_entity');

    const {name,surname,username,email} = data;

    // identification of the user has changed, we need to check that no one else is using such values
    if (user.email !== email || user.username !== username) {
        const availabilities = await checkIdentifierAvailability({email, username}, user._id.toString());

        if (!availabilities.email || !availabilities.username)
            throw new BadRequestError('Cannot change the email or username to ones already in use by other users.', 'duplicate_credentials');

        user.email = email;
        user.username = username;
    }

    user.name = name;
    user.surname = surname;

    return await user.save();
}
