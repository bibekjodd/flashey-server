import { CustomError } from '@/lib/custom-error';
import { messages } from '@/lib/messages';
import { loginUserSchema, registerUserSchema } from './user-validation-schema';

export const validateRegisterUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new CustomError(messages.form_fields_required, 400);
  }
};

export const validateLoginUser = (user: unknown) => {
  try {
    loginUserSchema.parse(user);
  } catch (error) {
    throw new CustomError(messages.form_fields_required, 400);
  }
};
