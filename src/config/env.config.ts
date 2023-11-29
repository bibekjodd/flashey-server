import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env' });
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'testing'])
    .readonly()
    .default('development')
    .optional(),
  PORT: z.string().optional().readonly(),
  JWT_SECRET: z.string().readonly(),
  FRONTEND_URL: z.string().readonly(),
  MONGO_URI: z.string().readonly(),

  CLOUDINARY_CLOUD_NAME: z.string().readonly(),
  CLOUDINARY_API_KEY: z.string().readonly(),
  CLOUDINARY_API_SECRET: z.string().readonly(),

  PUSHER_APP_ID: z.string().readonly(),
  PUSHER_APP_KEY: z.string().readonly(),
  PUSHER_APP_SECRET: z.string().readonly(),
  PUSHER_APP_CLUSTER: z.string().readonly()
});
export const env = envSchema.parse(process.env);
export type EnvType = z.infer<typeof envSchema>;
