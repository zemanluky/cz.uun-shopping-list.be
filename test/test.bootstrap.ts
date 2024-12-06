import {afterAll, afterEach, beforeAll} from "bun:test";
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoInMemory: MongoMemoryServer;

beforeAll(async () => {
    mongoInMemory = await MongoMemoryServer.create({
        binary: {
            version: "8.0.4"
        }
    });
    await mongoose.connect(mongoInMemory.getUri());
});
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoInMemory.stop();
});
afterEach(async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections)
        await collections[key].deleteMany();
});