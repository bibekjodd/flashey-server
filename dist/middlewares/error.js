"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
const mongoose_1 = require("mongoose");
const messages_1 = require("../lib/messages");
const error = (err, req, res, next) => {
    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;
    // @ts-ignore
    if (err instanceof mongoose_1.MongooseError && err.kind === "ObjectId") {
        err.message = messages_1.messages.invalid_id;
    }
    res.status(err.statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
exports.error = error;
