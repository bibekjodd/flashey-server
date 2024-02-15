import z from 'zod';
import { imageSchema } from './common.dto';

export const fetchChatsQuerySchema = z.object({
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

export const createGroupChatSchema = z.object({
  name: z
    .string({ required_error: 'group name is required' })
    .min(4, 'Group name is too short')
    .max(40, 'Group name must not exceed 40 characters'),
  members: z
    .array(z.string())
    .max(9, "Group chat can't have more than 10 members")
});

export const updateGroupSchema = z.object({
  name: z
    .string({ required_error: 'group name is required' })
    .min(4, 'Group name is too short')
    .max(40, 'Group name must not exceed 40 characters')
    .optional(),
  image: imageSchema.nullish(),
  members: z
    .array(z.string())
    .max(8, "Group chat can't have more than 10 members")
});

export const addToGroupChatSchema = z.object({
  members: z.array(z.string())
});

export const removeFromGroupSchema = addToGroupChatSchema;
