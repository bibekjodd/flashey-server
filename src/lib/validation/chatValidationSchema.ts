import { z } from "zod";

export const createGroupChatSchema = z.object({
  groupName: z.string().min(4),
  users: z.array(z.string()).min(1),
});

export type CreateGroupChatSchema = z.infer<typeof createGroupChatSchema>;
