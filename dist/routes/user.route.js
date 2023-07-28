"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post("/register", user_controller_1.createUser);
router.post("/login", user_controller_1.login);
router.get("/profile", auth_1.isAuthenticated, user_controller_1.myProfile);
router.get("/logout", user_controller_1.logout);
router.get("/users", auth_1.isAuthenticated, user_controller_1.searchUsers);
router.get("/suggestedusers", auth_1.isAuthenticated, user_controller_1.suggestedUsers);
exports.default = router;
