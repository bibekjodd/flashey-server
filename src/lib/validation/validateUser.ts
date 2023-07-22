import { ErrorHandler } from "../errorHandler";
import { messages } from "../messages";
import { loginUserSchema, registerUserSchema } from "./userValidationSchema";

export const validateRegisterUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler(messages.form_fields_required, 400);
  }
};

export const validateLoginUser = (user: unknown) => {
  try {
    loginUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler(messages.form_fields_required, 400);
  }
};
