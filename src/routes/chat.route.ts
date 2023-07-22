import { Router } from "express";
import {
  accessChat,
  accessFriendsChat,
  addToGroup,
  createGroupChat,
  fetchChats,
  removeFromGroup,
  renameGroup,
} from "../controllers/chat.controller";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.get("/chat/user/:friendsId", isAuthenticated, accessFriendsChat);
router.get("/chat/group/:chatId", isAuthenticated, accessChat);
router.get("/fetchchats", isAuthenticated, fetchChats);
router.post("/group/create", isAuthenticated, createGroupChat);
router.put("/group/add", isAuthenticated, addToGroup);
router.put("/group/remove", isAuthenticated, removeFromGroup);
router.put("/group/rename", isAuthenticated, renameGroup);

export default router;
