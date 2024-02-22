import z from 'zod';
import { imageSchema } from './common.dto';

const nameSchema = z
  .string()
  .min(4, 'Too short name')
  .max(20, 'Too long name')
  .transform((name) => name.trim());
const emailSchema = z
  .string()
  .email()
  .max(40, 'Too long email')
  .transform((email) => email.trim());
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

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    image: imageSchema.nullish()
  })
  .refine((data) => {
    if (!data.name && !data.image) return false;
    return true;
  }, 'At least one of name or image is required to update profile');

export const getFriendsListSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => {
      const page = Number(value) || 1;
      if (page < 1) return 1;
      return page;
    }),
  page_size: z
    .string()
    .optional()
    .transform((value) => {
      const page_size = Number(value) || 10;
      if (page_size < 1 || page_size > 10) return 10;
      return page_size;
    })
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
