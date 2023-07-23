import { CookieOptions, Response } from "express";
import { IUser } from "../models/User.Model";
import jwt from "jsonwebtoken";

const cookieOptions: CookieOptions = {
  maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV !== "production" ? false : true,
  sameSite: process.env.NODE_ENV !== "production" ? "lax" : "none",
};

export const logoutCookieOptions: CookieOptions = {
  maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV !== "production" ? false : true,
  sameSite: process.env.NODE_ENV !== "production" ? "lax" : "none",
};

export const sendToken = (res: Response, user: IUser, statusCode?: number) => {
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // @ts-ignore
  user.password = undefined;
  res
    .status(statusCode || 200)
    .cookie("token", token, cookieOptions)
    .json({ user });
};
