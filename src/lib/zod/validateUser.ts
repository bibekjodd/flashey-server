import { ErrorHandler } from "../errorHandler";
import { registerUserSchema } from "./userValidationSchema";

export const validateRegisterUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler("Please enter required fields", 400);
  }
};

export const validateLoginUser = (user: unknown) => {
  try {
    registerUserSchema.parse(user);
  } catch (error) {
    throw new ErrorHandler("Please enter required fields", 400);
  }
};
