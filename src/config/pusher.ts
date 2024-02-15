import Pusher from 'pusher';
import { env } from './env.config';

const initializePusher = (): Pusher => {
  if (!globalThis.__PUSHER__) {
    globalThis.__PUSHER__ = new Pusher({
      appId: env.PUSHER_APP_ID,
      cluster: 'mt1',
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET
    });
  }
  return globalThis.__PUSHER__;
};

export const pusher = initializePusher();
