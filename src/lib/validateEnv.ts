import { z } from "zod";
import dotenv from "dotenv";
import devConsole from "./devConsole";

const envSchema = z.object({
  MONGO_URI: z.string().min(5),
});
export type EnvType = z.infer<typeof envSchema>;

global.envLoaded = false;
export default function validateEnv() {
  if (process.env.NODE_ENV !== "production") {
    dotenv.config({
      path: ".env",
    });
  }

  try {
    envSchema.parse(process.env);
    envLoaded = true;
  } catch (error) {
    envLoaded = false;
    devConsole("MONGO_URI is not loaded on environment".red);
  }
}
