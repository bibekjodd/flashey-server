import Pusher from "pusher";

const initializePusher = () => {
  if (global.pusher) return;
  const newPusherInstance = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
  });

  global.pusher = newPusherInstance;
};

export default initializePusher;
