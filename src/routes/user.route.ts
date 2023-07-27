import express from "express";
import {
  createUser,
  logout,
  myProfile,
  searchUsers,
  suggestedUsers,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";
// @ts-ignore
import passport from "passport";
import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
const router = express.Router();

router.post("/register", createUser);
router.get("/profile", isAuthenticated, myProfile);
router.get("/logout", logout);
router.get("/users", isAuthenticated, searchUsers);
router.get("/suggestedusers", isAuthenticated, suggestedUsers);

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
  }),
  (req, res, next) => {
    // @ts-ignore
    req.session.origin = req.query.origin;
    next();
  }
);

router.get("/callback/google", passport.authenticate("google"), (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: messages.unauthenticated });
  }
  res.send(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Flashey</title>
      </head>
      <body>
        <p>Redirecting to flashey...</p>
        <script>
          window.onload = () => {
            window.open("${process.env.WEB_FRONTEND_URL}", "_self");
          };
        </script>
      </body>
    </html>
    `
  );
});

export default router;
