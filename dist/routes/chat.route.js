"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/chat/user/:friendsId", auth_1.isAuthenticated, chat_controller_1.accessFriendsChat);
router.get("/chat/group/:chatId", auth_1.isAuthenticated, chat_controller_1.accessChat);
router.get("/fetchchats", auth_1.isAuthenticated, chat_controller_1.fetchChats);
router.post("/group/create", auth_1.isAuthenticated, chat_controller_1.createGroupChat);
router.put("/group/add", auth_1.isAuthenticated, chat_controller_1.addToGroup);
router.put("/group/remove", auth_1.isAuthenticated, chat_controller_1.removeFromGroup);
router.put("/group/rename", auth_1.isAuthenticated, chat_controller_1.renameGroup);
router.post("/typing", auth_1.isAuthenticated, chat_controller_1.typingUpdate);
exports.default = router;
