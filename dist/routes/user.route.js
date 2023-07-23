"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const passport_1 = __importDefault(require("passport"));
const errorHandler_1 = require("../lib/errorHandler");
const messages_1 = require("../lib/messages");
const router = express_1.default.Router();
router.post("/register", user_controller_1.createUser);
router.get("/profile", auth_1.isAuthenticated, user_controller_1.myProfile);
router.get("/logout", user_controller_1.logout);
router.get("/users/:search", auth_1.isAuthenticated, user_controller_1.searchUsers);
router.post("/login", passport_1.default.authenticate("local"), (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.unauthenticated, 401));
    }
    // @ts-ignore
    req.user.password = undefined;
    res.status(200).json({ user: req.user });
});
router.get("/login/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
    successRedirect: process.env.WEB_FRONTEND_URL,
}));
router.get("/callback/google", passport_1.default.authenticate("google", {
    failureRedirect: "/",
    successRedirect: process.env.WEB_FRONTEND_URL,
}));
exports.default = router;
