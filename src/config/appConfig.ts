import validateEnv from "../lib/validateEnv";
import express, { Express } from "express";
import { connectDatabase } from "./database";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import mongoose from "mongoose";
import { configureCloudinary } from "../lib/cloudinary";

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

  // app configs
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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
