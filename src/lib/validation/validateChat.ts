import { createGroupChatSchema } from "./chatValidationSchema";
import { ErrorHandler } from "../errorHandler";

export const validateCreateGroupChat = (data: unknown) => {
  try {
    createGroupChatSchema.parse(data);
  } catch (error) {
    throw new ErrorHandler(
      "Make sure the group name is specified and at least 2 users are required to form a group chat",
      400
    );
  }
};
