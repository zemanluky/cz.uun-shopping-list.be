import express from 'express';
import cookieParser from 'cookie-parser';
import {errorHandler} from "./src/helper/error.handler.ts";
import {connectToMongo} from "./src/helper/mongo.connector.ts";
import {authController} from "./src/controller/auth.controller.ts";
import {userController} from "./src/controller/user.controller.ts";

// initialize connection to MongoDB
await connectToMongo();

// initialize app server
const app = express();
const port = process.env.APP_PORT || 8000;

// parse json body and req cookies
app.use(express.json());
app.use(cookieParser());

// controller registration
app.use('/auth', authController);
app.use('/user', userController);

// global handler for app specified exceptions
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 UUN shopping list API is now running on port ${port}!`));