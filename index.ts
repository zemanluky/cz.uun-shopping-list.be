import express from 'express';
import {helloWorldController} from "./src/controller/hello-world.controller.ts";
import {errorHandler} from "./src/helper/error.handler.ts";
import {connectToMongo} from "./src/helper/mongo.connector.ts";

// initialize connection to MongoDB
await connectToMongo();

// initialize app server
const app = express();
const port = process.env.APP_PORT || 8000;

// parse json body
app.use(express.json());

// controller registration
app.use('/hello', helloWorldController);

// global handler for app specified exceptions
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 UUN shopping list API is now running on port ${port}!`));