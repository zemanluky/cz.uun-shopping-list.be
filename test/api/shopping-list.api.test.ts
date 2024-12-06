import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it} from "bun:test";
import request from "supertest";
import app from "../../index.ts";
import {
    ShoppingList,
    type THydratedShoppingListDocument,
    type TShoppingList
} from "../../src/schema/db/shopping-list.schema.ts";
import {login} from "../../src/service/auth.service.ts";
import {createUser} from "../../src/service/user.service.ts";
import type {THydratedUserDocument} from "../../src/schema/db/user.schema.ts";
import type {TErrorResponse, TPaginatedResponse, TSuccessResponse} from "../../src/helper/response.helper.ts";
import {Types} from "mongoose";
import type {
    TShoppingListDetail,
    TShoppingListItemStatistics,
    TShoppingListOverview
} from "../../src/utils/shopping-list.utils.ts";
import {EShoppingListMemberPermission} from "../../src/schema/db/shopping-list-member.schema.ts";
import type {TShoppingListBody, TUpdateShoppingListBody} from "../../src/schema/request/shopping-list.schema.ts";
import { addDays, subDays } from "date-fns";
import * as querystring from "node:querystring";

const randomObjectId = '673289555ed4989365fa34a2';

/**
 * Gets access token for testing purposes.
 */
async function getAccessToken(email: string, password: string): Promise<string> {
    const { access } = await login({ login: email, password });
    return access;
}

describe("/shopping-list - Shopping list CRUD API", () => {
    let accessToken: string;
    let user: THydratedUserDocument;
    let user2: THydratedUserDocument;
    let shoppingList: THydratedShoppingListDocument;
    let shoppingList2: THydratedShoppingListDocument;
    let shoppingList3: THydratedShoppingListDocument;

    beforeEach(async () => {
        const userPassword = "123456Ab+";

        // create the test user before each test
        user = await createUser({
            password: userPassword,
            email: "test@test.com",
            username: "test_user",
            surname: "Test",
            name: "Test"
        });
        user2 = await createUser({
            password: userPassword,
            email: "test2@test.com",
            username: "second_test_user",
            surname: "Test2",
            name: "Test2"
        });

        // get access token for the created user
        accessToken = await getAccessToken(user.email, userPassword);

        // create a test shopping list before each test
        const list = new ShoppingList({
            complete_by: new Date(),
            name: "Test Shopping List",
            author: user._id,
            items: [
                {quantity: "1 pack", name: "Lays chips"},
            ],
        });
        shoppingList = await list.save();

        // create a second list to test permissions
        const list2 = new ShoppingList({
            complete_by: new Date(),
            name: "Test Shopping List 2",
            author: user2._id,
            items: [
                {quantity: "1 pack", name: "Lays chips"},
            ],
            members: [
                {user: user._id, permission: EShoppingListMemberPermission.read}
            ]
        });
        shoppingList2 = await list2.save();

        // create a third list to test viewing in list
        const list3 = new ShoppingList({
            complete_by: new Date(),
            name: "Test Shopping List 3",
            author: user2._id,
            items: [
                {quantity: "1 pack", name: "Lays chips"},
            ]
        });
        shoppingList3 = await list3.save();
    });


    describe("GET / - List shopping lists", () => {
        it("should return 200 OK - list of shopping lists the user is author or member of", async () => {
            const response = await request(app).get(`/shopping-list`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(2);
            expect(typedBody.data.items).toBeArray();

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList._id.toString());
            expect(returnedIds).toContainEqual(shoppingList2._id.toString());
            expect(returnedIds).not.toContainEqual(shoppingList3._id.toString());
        });

        it("should return 200 OK - list of shopping lists the user is author of", async () => {
            const queryParams = querystring.encode({ includeOnly: "own" });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(1);
            expect(typedBody.data.items).toBeArray();

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList._id.toString());
            expect(returnedIds).not.toContainEqual(shoppingList2._id.toString());
            expect(returnedIds).not.toContainEqual(shoppingList3._id.toString());
        });

        it("should return 200 OK - list of shopping lists the user is member of", async () => {
            const queryParams = querystring.encode({ includeOnly: "shared" });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(1);
            expect(typedBody.data.items).toBeArray();

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList2._id.toString());
            expect(returnedIds).not.toContainEqual(shoppingList._id.toString());
            expect(returnedIds).not.toContainEqual(shoppingList3._id.toString());
        });

        it("should return 200 OK - list of shopping lists where tha name contains 'party'", async () => {
            const queryParams = querystring.encode({ search: "party" });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(0);
            expect(typedBody.data.items).toBeArray();
            expect(typedBody.data.items).toHaveLength(0);
        });

        it("should return 200 OK - list of shopping lists where tha name contains 'List 2'", async () => {
            const queryParams = querystring.encode({ search: "list 2" });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(1);
            expect(typedBody.data.items).toBeArray();
            expect(typedBody.data.items).toHaveLength(1);

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList2._id.toString());
        });

        it("should return 200 OK - list of shopping lists the author is the second user", async () => {
            const queryParams = querystring.encode({ author: user2._id.toString() });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(1);
            expect(typedBody.data.items).toBeArray();
            expect(typedBody.data.items).toHaveLength(1);

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList2._id.toString());
        });

        it("should return 200 OK - list of shopping lists the author is the second user", async () => {
            const queryParams = querystring.encode({ author: user2._id.toString() });
            const response = await request(app).get(`/shopping-list?${queryParams}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TPaginatedResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toContainKeys(['items', 'total', 'filtered', 'maxPage', 'pageSize']);
            expect(typedBody.data.total).toEqual(2);
            expect(typedBody.data.filtered).toEqual(1);
            expect(typedBody.data.items).toBeArray();
            expect(typedBody.data.items).toHaveLength(1);

            const returnedIds = typedBody.data.items.map(item => item._id.toString());

            expect(returnedIds).toContainEqual(shoppingList2._id.toString());
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const response = await request(app).get(`/shopping-list`).send();

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });
    });

    describe("GET /:id - Get detail of a shopping list", () => {
        it("should return 200 OK - retrieved the user's own shopping list", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).get(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data._id.toString()).toBe(shoppingListId);
        });

        it("should return 200 OK - retrieved shopping list the user is member of", async () => {
            const shoppingList2Id = shoppingList2._id.toString();
            const response = await request(app).get(`/shopping-list/${shoppingList2Id}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListOverview & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data._id.toString()).toBe(shoppingList2Id);
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).get(`/shopping-list/${shoppingListId}`).send();

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });

        it("should return 403 Forbidden - user not authorized to view the list", async () => {
            shoppingList.author = new Types.ObjectId(randomObjectId);
            const shoppingListId = (await shoppingList.save())._id.toString();

            const response = await request(app).get(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:read");
        });

        it("should return 404 Not Found - shopping list not found", async () => {
            const response = await request(app).get(`/shopping-list/${randomObjectId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("not_found.shopping_list");
        });
    });

    describe("POST / - Create a new shopping list", () => {
        it("should return 201 Created - successfully created new shopping list", async () => {
            const data: TShoppingListBody = {
                name: "Test Shopping List 3",
                complete_by: addDays(new Date(), 1)
            };

            const response = await request(app).post(`/shopping-list`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(data);

            expect(response.status).toBe(201);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListDetail & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data.author._id).toBe(user._id.toString());
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const data: TShoppingListBody = {
                name: "Test Shopping List 3",
                complete_by: addDays(new Date(), 1)
            };
            const response = await request(app).post(`/shopping-list`).send(data);

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });

        it("should return 422 Unprocessable entity - missing data", async () => {
            const response = await request(app).post(`/shopping-list`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send();

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });

        it("should return 422 Unprocessable entity - date in the past", async () => {
            const data: TShoppingListBody = {
                name: "Test shopping list 3",
                complete_by: subDays(new Date(), 1)
            };

            const response = await request(app).post(`/shopping-list`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(data);

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });

        it("should return 422 Unprocessable entity - false name", async () => {
            const data: TShoppingListBody = {
                name: "",
                complete_by: addDays(new Date(), 1)
            };

            const response = await request(app).post(`/shopping-list`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(data);

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });
    });

    describe("PUT /:id - Update existing shopping list", () => {
        it("should return 200 OK - successful update of name only", async () => {
            const shoppingListId = shoppingList._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 1 - updated",
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListDetail & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data.name).toBe(updatedData.name);
        });

        it("should return 200 OK - successful update of name and completion date", async () => {
            const shoppingListId = shoppingList._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 1 - updated",
                complete_by: addDays(new Date(), 1)
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListDetail & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data.name).toBe(updatedData.name);
            expect(new Date(typedBody.data.complete_by)).toEqual(updatedData.complete_by!);
        });

        it("should return 400 Bad Request - shopping list to update is already closed", async () => {
            shoppingList.closed_at = new Date();
            const shoppingListId = (await shoppingList.save())._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 1 - updated",
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(400);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("shopping_list:edit_closed_list");
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const shoppingListId = shoppingList._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 1 - updated",
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });

        it("should return 403 Forbidden - user not authorized to delete the list", async () => {
            const shoppingList2Id = shoppingList2._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 2 - updated",
            };

            const response = await request(app).put(`/shopping-list/${shoppingList2Id}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:write");
        });

        it("should return 404 Not Found - shopping list to update not found", async () => {
            const updatedData: TUpdateShoppingListBody = {
                name: "Test Shopping List 1 - updated",
            };

            const response = await request(app).put(`/shopping-list/${randomObjectId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(404);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("not_found.shopping_list");
        });


        it("should return 422 Unprocessable entity - missing data", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send();

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });

        it("should return 422 Unprocessable entity - date in the past", async () => {
            const shoppingListId = shoppingList._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: "Test shopping list 1 - updated",
                complete_by: subDays(new Date(), 1)
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });

        it("should return 422 Unprocessable entity - false name", async () => {
            const shoppingListId = shoppingList._id.toString();
            const updatedData: TUpdateShoppingListBody = {
                name: ""
            };

            const response = await request(app).put(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" })
                .send(updatedData);

            expect(response.status).toBe(422);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("validation_error");
        });
    });

    describe("DELETE /:id - Delete a shopping list", async () => {
        it("should return 204 No Content - successful delete", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).delete(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(204);
        });

        it("should return 400 Bad Request - shopping list to delete is already closed", async () => {
            shoppingList.closed_at = new Date();
            const shoppingListId = (await shoppingList.save())._id.toString();

            const response = await request(app).delete(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(400);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("shopping_list:delete_closed_list");
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).delete(`/shopping-list/${shoppingListId}`).send();

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });

        it("should return 403 Forbidden - user not authorized to delete the list as a random user", async () => {
            shoppingList.author = new Types.ObjectId(randomObjectId);
            const shoppingListId = (await shoppingList.save())._id.toString();

            const response = await request(app).delete(`/shopping-list/${shoppingListId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:delete");
        });

        it("should return 403 Forbidden - user not authorized to delete the list as a member", async () => {
            const shoppingList2Id = shoppingList2._id.toString();

            const response = await request(app).delete(`/shopping-list/${shoppingList2Id}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:delete");
        });

        it("should return 404 Not Found - shopping list to delete not found", async () => {
            const response = await request(app).delete(`/shopping-list/${randomObjectId}`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("not_found.shopping_list");
        });
    });

    describe("PATCH /:id/completed-status - Close a shopping list", () => {
        it("should return 200 OK - successfully closed shopping list", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).patch(`/shopping-list/${shoppingListId}/completed-status`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();

            const typedBody = response.body as TSuccessResponse<TShoppingListDetail & TShoppingListItemStatistics>;

            expect(typedBody.success).toBeTrue();
            expect(typedBody.data).toBeDefined();
            expect(typedBody.data._id.toString()).toBe(shoppingListId);
            expect(typedBody.data.closed_at).not.toBeNull();

            typedBody.data.items.forEach(item => expect(item.completed).not.toBeNull());
        });

        it("should return 400 Bad Request - shopping list is already closed", async () => {
            shoppingList.closed_at = new Date();
            const shoppingListId = (await shoppingList.save())._id.toString();

            const response = await request(app).patch(`/shopping-list/${shoppingListId}/completed-status`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(400);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("shopping_list:closing_closed_list");
        });

        it("should return 401 Unauthorized - user not authenticated", async () => {
            const shoppingListId = shoppingList._id.toString();
            const response = await request(app).patch(`/shopping-list/${shoppingListId}/completed-status`).send();

            expect(response.status).toBe(401);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("unauthenticated");
        });

        it("should return 403 Forbidden - user not authorized to close the list as a random user", async () => {
            shoppingList.author = new Types.ObjectId(randomObjectId);
            const shoppingListId = (await shoppingList.save())._id.toString();

            const response = await request(app).patch(`/shopping-list/${shoppingListId}/completed-status`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:write");
        });

        it("should return 403 Forbidden - user not authorized to close the list as a member", async () => {
            const shoppingList2Id = shoppingList2._id.toString();

            const response = await request(app).patch(`/shopping-list/${shoppingList2Id}/completed-status`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(403);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("forbidden_action.shopping_list:write");
        });

        it("should return 404 Not Found - shopping list to close not found", async () => {
            const response = await request(app).patch(`/shopping-list/${randomObjectId}/completed-status`)
                .set({ Authorization: `Bearer ${accessToken}` })
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toBeDefined();
            expect((response.body as TErrorResponse).error).toBeDefined();
            expect((response.body as TErrorResponse).error.code).toBe("not_found.shopping_list");
        });
    });
});