import { type ErrorRequestHandler } from 'express';
import { CustomError } from '@/lib/custom-error';

export const handleErrorRequest: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  next;
  let message = err.message || 'Internal Server Error';
  let statusCode = err.statusCode || 500;
  if (err instanceof Error) {
    message = err.message || message;
  }

  if (err instanceof CustomError) {
    message = err.message;
    statusCode = err.statusCode;
  }

  return res.status(statusCode).json({ message });
};
