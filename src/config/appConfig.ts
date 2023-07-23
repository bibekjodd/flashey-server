import validateEnv from "../lib/validateEnv";
import express, { Express } from "express";
import expressSession from "express-session";
import { connectDatabase } from "./database";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import mongoose from "mongoose";
import { configureCloudinary } from "../lib/cloudinary";
// import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { initializeGoogleAuth } from "../lib/auth/googlAuth";
import { initializeLocalAuth } from "../lib/auth/localAuth";

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

  app.use(
    expressSession({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "development" ? false : true,
        httpOnly: process.env.NODE_ENV === "development" ? false : true,
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000,
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

  initializeLocalAuth();
  initializeGoogleAuth();

  app.use(passport.initialize());
  app.use(passport.session());

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
