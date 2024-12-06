import express from 'express';
import cookieParser from 'cookie-parser';
import {errorHandler} from "./src/helper/error.handler.ts";
import {connectToMongo} from "./src/helper/mongo.connector.ts";
import {authController} from "./src/controller/auth.controller.ts";
import {userController} from "./src/controller/user.controller.ts";
import {NotFoundError} from "./src/error/response/not-found.error.ts";
import {shoppingListItemController} from "./src/controller/shopping-list-item.controller.ts";
import {shoppingListController} from "./src/controller/shopping-list.controller.ts";
import {authenticateRequest} from "./src/helper/request.guard.ts";
import {shoppingListMemberController} from "./src/controller/shopping-list-member.controller.ts";

// initialize connection to MongoDB
if (Bun.env.NODE_ENV !== 'test') await connectToMongo();

// initialize app server
const app = express();
const port = process.env.APP_PORT || 8000;

// parse json body and req cookies
app.use(express.json());
app.use(cookieParser());

// controller registration
app.use('/auth', authController);
app.use('/user', userController);
app.use('/shopping-list', authenticateRequest(), shoppingListController);
app.use('/shopping-list/:id/item', authenticateRequest(), shoppingListItemController);
app.use('/shopping-list/:id/member', authenticateRequest(), shoppingListMemberController);

// global handler for app specified exceptions
app.use((req, res, next) => {
    next(new NotFoundError('API endpoint not found.', 'resource'));
});
app.use(errorHandler);

app.listen(port, () => console.log(`🥳 UUN shopping list API is now running on port ${port}!`));

export default app;