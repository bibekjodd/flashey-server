import { EnvType } from "./src/lib/validateEnv";
import { IUser } from "./src/models/User.Model";
import type Pusher from "pusher";

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      NODE_ENV: "development" | "production";
      JWT_SECRET: string;
      FRONTEND_URL: string;
      WEB_FRONTEND_URL: string;

      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;

      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      CALLBACK_URL: string;
      SESSION_SECRET: string;

      PUSHER_APP_ID: string;
      PUSHER_APP_KEY: string;
      PUSHER_APP_SECRET: string;
      PUSHER_APP_CLUSTER: string;
    }
  }

  namespace Express {
    interface Request {
      user: IUser;
    }
  }

  var envLoaded: boolean;
  var databaseConnected: boolean;
  var pusher: Pusher;
}
