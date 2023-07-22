import { Router } from "express";
import {
  addReaction,
  removeReaction,
  sendMessage,
} from "../controllers/message.controller";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.route("/message/:chatId").post(isAuthenticated, sendMessage);
router
  .route("/reaction/:messageId")
  .put(isAuthenticated, addReaction)
  .delete(isAuthenticated, removeReaction);

export default router;
