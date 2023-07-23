"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.logoutCookieOptions = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookieOptions = {
    maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "production" ? false : true,
    sameSite: process.env.NODE_ENV !== "production" ? "lax" : "none",
};
exports.logoutCookieOptions = {
    maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV !== "production" ? false : true,
    sameSite: process.env.NODE_ENV !== "production" ? "lax" : "none",
};
const sendToken = (res, user, statusCode) => {
    const token = jsonwebtoken_1.default.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    // @ts-ignore
    user.password = undefined;
    res
        .status(statusCode || 200)
        .cookie("token", token, cookieOptions)
        .json({ user });
};
exports.sendToken = sendToken;
