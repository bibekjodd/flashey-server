import z from 'zod';
import { imageSchema } from './common.dto';

const nameSchema = z.string().min(4, 'Too short name').max(20, 'Too long name');
const emailSchema = z.string().email().max(40, 'Too long email');
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(12, 'Too long password');

export const registerUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  image: imageSchema.optional()
});

export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const queryUsersSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((q) => q || ''),
  page: z
    .string()
    .optional()
    .transform((value) => {
      let page = Number(value) || 1;
      if (page < 1) page = 1;
      return page;
    }),
  page_size: z
    .string()
    .optional()
    .transform((value) => {
      let page_size = Number(value) || 10;
      if (page_size < 1) page_size = 1;
      if (page_size > 10) page_size = 10;
      return page_size;
    })
});
