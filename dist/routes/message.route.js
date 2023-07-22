"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.route("/message/:chatId").post(auth_1.isAuthenticated, message_controller_1.sendMessage);
router
    .route("/reaction/:messageId")
    .put(auth_1.isAuthenticated, message_controller_1.addReaction)
    .delete(auth_1.isAuthenticated, message_controller_1.removeReaction);
exports.default = router;
