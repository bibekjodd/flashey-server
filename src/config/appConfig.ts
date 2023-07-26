import validateEnv from "../lib/validateEnv";
import express, { Express } from "express";
import session from "express-session";
import { connectDatabase } from "./database";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import mongoose from "mongoose";
import { configureCloudinary } from "../lib/cloudinary";
// import cookieParser from "cookie-parser";
import cors from "cors";
// @ts-ignore
import passport from "passport";
import { initializeGoogleAuth } from "../lib/auth/googlAuth";
import { initializeLocalAuth } from "../lib/auth/localAuth";
import initializePusher from "./pusher";

/**
 * Initial config for app
 *
 * Checks `process.env`
 *
 * Connects database & adds some required middleware
 */
export default function initialConfig(app: Express) {
  validateEnv();
  connectDatabase();

  configureCloudinary();

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  initializePusher();

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,

      cookie: {
        secure: process.env.NODE_ENV !== "production" ? false : true,
        sameSite: process.env.NODE_ENV !== "production" ? "lax" : "none",
        httpOnly: true,
      },
    })
  );
  app.enable("trust proxy");
  app.use(
    cors({
      origin: process.env.FRONTEND_URL.split(" ") || [],
      credentials: true,
    })
  );

  app.use(passport.authenticate("session"));
  app.use(passport.initialize());
  app.use(passport.session());

  initializeLocalAuth();
  initializeGoogleAuth();

  app.use(
    catchAsyncError(async (req, res, next) => {
      if (
        mongoose.ConnectionStates.disconnected ||
        mongoose.ConnectionStates.uninitialized ||
        mongoose.connections.length < 1
      ) {
        await connectDatabase();
      }

      next();
    })
  );
  app.get("/api/status", (req, res) => {
    res.json({
      databaseConnected,
      envLoaded,
      env: process.env.NODE_ENV,
      mongooseConnections: mongoose.connections.length,
    });
  });
  //
}
