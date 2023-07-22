import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(4),
  email: z.string().min(4),
  password: z.string().min(4),
  imageUri: z.string().optional(),
});
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email: z.string().min(4),
  password: z.string().min(4),
});
export type LoginUserSchema = z.infer<typeof loginUserSchema>;
