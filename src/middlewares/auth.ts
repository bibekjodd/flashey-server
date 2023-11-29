import { env } from '@/config/env.config';
import { CustomError } from '@/lib/custom-error';
import { messages } from '@/lib/messages';
import User from '@/models/user.model';
import jwt from 'jsonwebtoken';
import { catchAsyncError } from './catch-async-error';

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  let { token } = req.cookies;
  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new CustomError(messages.unauthenticated, 401));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      _id: string;
    };
    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new CustomError(messages.unauthenticated, 401));
    }
    req.user = user;
  } catch (err) {
    return next(new CustomError(messages.unauthenticated, 401));
  }

  next();
});

export const isAdmin = catchAsyncError(async (req, res, next) => {
  if (req.user.role !== 'admin')
    return next(new CustomError(messages.non_admin, 403));

  next();
});
