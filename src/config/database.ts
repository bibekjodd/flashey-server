import devConsole from '@/lib/dev-console';
import mongoose from 'mongoose';
import { env } from './env.config';

export const connectDatabase = async () => {
  try {
    const { connection } = await mongoose.connect(env.MONGO_URI);

    devConsole(`Mongodb connected at ${connection.host}`.magenta);
  } catch (error) {
    if (error instanceof Error) devConsole(error.message);
    devConsole(`Error occured while connecting mongodb`.red);
  }
};
