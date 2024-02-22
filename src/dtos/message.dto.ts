import z from 'zod';
import { imageSchema } from './common.dto';

export const sendMessageSchema = z
  .object({
    text: z
      .string()
      .nullish()
      .transform((text) => text?.trim() || text),
    image: imageSchema.nullish()
  })
  .refine((data) => {
    if (!data.text && !data.image) {
      return false;
    }
    return true;
  }, 'At least one of text or image is required to send message');

export const editMessageSchema = sendMessageSchema;

export const fetchMessagesQuery = z.object({
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
