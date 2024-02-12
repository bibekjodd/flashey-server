import z from 'zod';

const imageRegExp = new RegExp(`(https?://.*.(png|gif|webp|jpeg|jpg))`);
export const imageSchema = z
  .string({ invalid_type_error: 'Invalid image url' })
  .trim()
  .regex(imageRegExp, 'invalid image url')
  .max(100, 'Too long image uri');

export const validReactions = [
  'like',
  'love',
  'haha',
  'angry',
  'wow',
  'sad'
] as const;
export const validReactionsSchema = z.enum(validReactions, {
  invalid_type_error: 'Invalid reaction'
});