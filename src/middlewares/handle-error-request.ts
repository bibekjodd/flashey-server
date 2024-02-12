import { env } from '@/config/env.config';
import { HttpException } from '@/lib/exceptions';
import { devConsole } from '@/lib/utils';
import { ErrorRequestHandler } from 'express';
import postgres from 'postgres';
import { ZodError } from 'zod';

export const handleErrorRequest: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  next;
  let stack: string | undefined = undefined;
  let message = err.message || 'Internal Server Error';
  let statusCode = err.statusCode || 500;
  if (err instanceof Error) {
    message = err.message || message;
    if (env.NODE_ENV === 'development') {
      stack = err.stack;
    }
  }

  if (err instanceof HttpException) {
    message = err.message;
    statusCode = err.statusCode;
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    const issue = err.issues.at(0);
    if (issue) {
      let zodMessage = `${issue.path}: ${issue.message}`;
      if (zodMessage.startsWith(': ')) {
        zodMessage = zodMessage.slice(2);
      }
      message = zodMessage || message;
    }
  }

  if (err instanceof postgres.PostgresError) {
    message = 'Invalid data or request sent';
    statusCode = 400;
    devConsole(err.message, 'Database Error'.red);
  }

  return res.status(statusCode).json({ message, stack });
};
