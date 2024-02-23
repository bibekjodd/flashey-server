import { env } from '@/config/env.config';
import bcrypt from 'bcryptjs';
import MongoStore from 'connect-mongo';
import type { CookieOptions } from 'express';
import { SessionOptions } from 'express-session';
import jwt from 'jsonwebtoken';

export const devConsole = (...args: string[]) => {
  if (env.NODE_ENV !== 'production') {
    console.log(args.join(' '));
  }
};

export const cookieOptions: CookieOptions = {
  maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: env.NODE_ENV !== 'production' ? false : true,
  sameSite: env.NODE_ENV !== 'production' ? 'lax' : 'none'
};

export const sessionOptions: SessionOptions = {
  resave: false,
  saveUninitialized: false,
  secret: env.SESSION_SECRET,
  proxy: true,
  cookie: cookieOptions,
  store: new MongoStore({ mongoUrl: env.MONGO_URI })
};

type AuthTokenPayload = { id: string };
export const generateAuthToken = (id: string): string => {
  const payload: AuthTokenPayload = { id };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  return token;
};

export const decodeAuthToken = (
  token: string | null | undefined
): string | null => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, env.JWT_SECRET) as
      | AuthTokenPayload
      | undefined;
    return decoded?.id || null;
  } catch (err) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
