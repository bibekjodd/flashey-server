import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { catchAsyncError } from "./catchAsyncError";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler(messages.unauthenticated, 401));
  }

  next();
});

export const isAdmin = catchAsyncError(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new ErrorHandler(messages.non_admin, 403));

  next();
});
