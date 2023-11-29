import type { EnvType } from '@/lib/validateEnv';
import { IUser } from './src/models/user.model';
import type Pusher from 'pusher';

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      [key: string]: string | undefined;
    }
  }

  namespace Express {
    interface Request {
      user: IUser;
    }
  }

  var pusher: Pusher;
}
