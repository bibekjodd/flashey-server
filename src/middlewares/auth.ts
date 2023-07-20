import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { catchAsyncError } from "./catchAsyncError";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next(new ErrorHandler(messages.unauthenticated));
  }
});
