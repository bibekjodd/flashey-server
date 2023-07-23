"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuthenticated = void 0;
const errorHandler_1 = require("../lib/errorHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const messages_1 = require("../lib/messages");
const catchAsyncError_1 = require("./catchAsyncError");
const User_Model_1 = __importDefault(require("../models/User.Model"));
exports.isAuthenticated = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.unauthenticated, 400));
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const user = await User_Model_1.default.findById(decoded._id);
    if (!user)
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.unauthenticated, 401));
    req.user = user;
    next();
});
exports.isAdmin = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    if (req.user.role !== "admin")
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.non_admin, 403));
    next();
});
