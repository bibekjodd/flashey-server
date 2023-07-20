import { EnvType } from "./src/lib/validateEnv";
import { IUser } from "./src/models/user.model";

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      NODE_ENV: "development" | "production";
    }
  }

  namespace Express {
    interface Request {
      user: IUser;
    }
  }

  var envLoaded: boolean;
  var databaseConnected: boolean;
}
