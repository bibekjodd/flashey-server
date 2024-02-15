import { EnvType } from '@/config/env.config';
import { UserSnapshot } from './schemas/user.schema';
import Pusher from 'pusher';

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      //
    }
  }

  namespace Express {
    interface Request {
      user: UserSnapshot;
    }
  }

  var __PUSHER__: Pusher | undefined;
}
