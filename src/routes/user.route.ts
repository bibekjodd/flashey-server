import express from "express";
import {
  createUser,
  login,
  logout,
  myProfile,
  searchUsers,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", login);
router.get("/me", isAuthenticated, myProfile);
router.get("/logout", logout);
router.get("/users/:search", isAuthenticated, searchUsers);

export default router;
