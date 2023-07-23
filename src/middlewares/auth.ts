import { ErrorHandler } from "../lib/errorHandler";
import jwt from "jsonwebtoken";
import { messages } from "../lib/messages";
import { catchAsyncError } from "./catchAsyncError";
import User from "../models/User.Model";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler(messages.unauthenticated,400));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as { _id: string };
  const user = await User.findById(decoded._id);
  if (!user) return next(new ErrorHandler(messages.unauthenticated, 401));

  req.user = user;
  next();
});

export const isAdmin = catchAsyncError(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new ErrorHandler(messages.non_admin, 403));

  next();
});
