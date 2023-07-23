"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuthenticated = void 0;
const errorHandler_1 = require("../lib/errorHandler");
const messages_1 = require("../lib/messages");
const catchAsyncError_1 = require("./catchAsyncError");
exports.isAuthenticated = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.unauthenticated, 401));
    }
    next();
});
exports.isAdmin = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    if (req.user.role !== "admin")
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.non_admin, 403));
    next();
});
