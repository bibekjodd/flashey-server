import { env } from '@/config/env.config';

export default function devConsole(...args: string[]) {
  if (env.NODE_ENV === 'development') {
    console.log(args.join(' '));
  }
}
