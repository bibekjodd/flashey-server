import { ErrorHandler } from "../errorHandler";
import { messages } from "../messages";
import { registerUserSchema } from "./userValidationSchema";

export const validateRegisterUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler(messages.form_fields_required, 400);
  }
};

export const validateLoginUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler(messages.form_fields_required, 400);
  }
};
