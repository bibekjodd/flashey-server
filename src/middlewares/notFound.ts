import { RequestHandler } from "express";
import { messages } from "../lib/messages";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    message: messages.not_found,
  });
};
