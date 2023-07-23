import express from "express";
import {
  createUser,
  logout,
  myProfile,
  searchUsers,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";
import passport from "passport";
import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
const router = express.Router();

router.post("/register", createUser);
router.get("/profile", isAuthenticated, myProfile);
router.get("/logout", logout);
router.get("/users/:search", isAuthenticated, searchUsers);

router.post("/login", passport.authenticate("local"), (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler(messages.unauthenticated, 401));
  }
  // @ts-ignore
  req.user.password = undefined;
  res.status(200).json({ user: req.user });
});

router.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    successRedirect: process.env.WEB_FRONTEND_URL,
  })
);

router.get(
  "/callback/google",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: process.env.WEB_FRONTEND_URL,
  })
);

export default router;
