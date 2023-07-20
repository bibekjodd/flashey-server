import express from "express";
import { createUser, login, myProfile } from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", login);
router.get("/me", isAuthenticated, myProfile);

export default router;
