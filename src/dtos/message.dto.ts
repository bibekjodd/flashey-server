import z from 'zod';
import { imageSchema } from './common.dto';

export const sendMessageSchema = z
  .object({
    text: z.string().nullish(),
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
