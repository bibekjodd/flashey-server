import { db } from '@/config/database';
import { chats, selectChatSnapshot } from '@/schemas/chat.schema';
import { participants } from '@/schemas/participant.schema';
import { selectUsersJSON, users } from '@/schemas/user.schema';
import { eq } from 'drizzle-orm';

export const fetchChat = async (chatId: string) => {
  const [chat] = await db
    .select({ ...selectChatSnapshot, participants: selectUsersJSON })
    .from(chats)
    .where(eq(chats.id, chatId))
    .innerJoin(participants, eq(chats.id, participants.chatId))
    .innerJoin(users, eq(participants.userId, users.id))
    .groupBy(chats.id)
    .limit(1);
  return chat;
};
