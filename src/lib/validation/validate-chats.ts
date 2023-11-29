import { createGroupChatSchema } from './chat-validation-schema';
import { CustomError } from '@/lib/custom-error';

export const validateCreateGroupChat = (data: unknown) => {
  try {
    createGroupChatSchema.parse(data);
  } catch (error) {
    throw new CustomError(
      'Make sure the group name is specified and at least 2 users are required to form a group chat',
      400
    );
  }
};
