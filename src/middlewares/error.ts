import { ErrorRequestHandler } from "express";
import { MongooseError } from "mongoose";
import { messages } from "../lib/messages";

export const error: ErrorRequestHandler = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  // @ts-ignore
  if (err instanceof MongooseError && err.kind === "ObjectId") {
    err.message = messages.invalid_id;
  }

  res.status(err.statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
