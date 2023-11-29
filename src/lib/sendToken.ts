import { env } from '@/config/env.config';
import { type IUser } from '@/models/user.model';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';

export const cookieOptions: CookieOptions = {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: env.NODE_ENV !== 'production' ? false : true,
  sameSite: env.NODE_ENV !== 'production' ? 'lax' : 'none'
};

export const sendToken = (res: Response, user: IUser, statusCode?: number) => {
  const token = jwt.sign({ _id: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: '7d'
  });

  // @ts-ignore
  user.password = undefined;
  res
    .status(statusCode || 200)
    .cookie('token', token, cookieOptions)
    .json({ user, token });
};
