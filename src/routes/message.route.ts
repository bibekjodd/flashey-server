import { Router } from "express";
import { sendMessage } from "../controllers/message.controller";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.route("/message/:chatId").post(isAuthenticated, sendMessage);

export default router;
