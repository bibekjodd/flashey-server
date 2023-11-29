import Pusher from 'pusher';
import { env } from './env.config';

const initializePusher = () => {
  if (global.pusher) return;
  const newPusherInstance = new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.PUSHER_APP_KEY,
    secret: env.PUSHER_APP_SECRET,
    cluster: env.PUSHER_APP_CLUSTER
  });

  global.pusher = newPusherInstance;
};

export default initializePusher;
