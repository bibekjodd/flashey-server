import { configureCloudinary } from '@/lib/cloudinary';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { connectDatabase } from './database';
import { env } from './env.config';
import initializePusher from './pusher';

/**
 * Initial config for app
 *
 * Checks `process.env`
 *
 * Connects database & adds some required middleware
 */
export default function initialConfig(app: Express) {
  connectDatabase();

  configureCloudinary();

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  initializePusher();

  app.enable('trust proxy');
  app.use(
    cors({
      origin: env.FRONTEND_URL.split(' ') || [],
      credentials: true
    })
  );

  app.get('/', (req, res) => {
    res.json({
      message: 'Api is running fine...',
      env: env.NODE_ENV
    });
  });
  //
}
