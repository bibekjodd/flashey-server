import z from 'zod';
import { imageSchema } from './common.dto';

export const fetchChatsQuerySchema = z.object({
  cursor: z
    .string()
    .datetime({ offset: true, message: 'Invalid cursor sent on request' })
    .optional()
    .transform((value) => value || new Date().toISOString()),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      const limit = Number(value) || 10;
      if (limit < 1 || limit > 10) return 10;
      return limit;
    })
});

export const createGroupChatSchema = z.object({
  name: z
    .string({ required_error: 'Group name is required' })
    .trim()
    .min(4, 'Group name is too short')
    .max(40, 'Group name must not exceed 40 characters')
    .transform((name) => name.trim()),
  members: z
    .array(z.string())
    .max(9, "Group chat can't have more than 10 members")
});

export const updateChatSchema = z
  .object({
    name: z
      .string({ required_error: 'group name is required' })
      .trim()
      .min(4, 'Group name is too short')
      .max(40, 'Group name must not exceed 40 characters')
      .optional(),
    image: imageSchema.nullish(),
    addMembers: z
      .array(z.string())
      .transform((value) => {
        const uniqueValues = new Set([...(value || [])]);
        return [...uniqueValues];
      })
      .optional(),
    removeMembers: z
      .array(z.string())
      .transform((value) => {
        const uniqueValues = new Set([...(value || [])]);
        return [...uniqueValues];
      })
      .optional()
  })
  .refine((data) => {
    if (Object.keys(data).length === 0) return false;
    return true;
  }, 'Provide at least one property to update chat');

export const addToChatSchema = z.object({
  members: z.array(z.string())
});

export const removeFromChatSchema = addToChatSchema;
