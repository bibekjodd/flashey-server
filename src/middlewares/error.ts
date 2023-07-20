import { ErrorRequestHandler } from "express";

export const error: ErrorRequestHandler = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  res.status(err.statusCode).json({
    message: err.message,
  });
};
