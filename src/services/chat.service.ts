import { db } from '@/config/database';
import { pusher } from '@/config/pusher';
import { ChatUpdatedResponse, EVENTS } from '@/lib/events';
import { chats, selectChatSnapshot } from '@/schemas/chat.schema';
import { members } from '@/schemas/member.schema';
import { messages } from '@/schemas/message.schema';
import { selectUsersJSON, users } from '@/schemas/user.schema';
import { desc, eq } from 'drizzle-orm';
import { BatchEvent } from 'pusher';

export const fetchChat = async (chatId: string) => {
  const [chat] = await db
    .select({ ...selectChatSnapshot, members: selectUsersJSON })
    .from(chats)
    .where(eq(chats.id, chatId))
    .innerJoin(members, eq(chats.id, members.chatId))
    .innerJoin(users, eq(members.userId, users.id))
    .groupBy(chats.id)
    .limit(1);
  return chat;
};

export const updateLastMessageOnChat = async (
  chatId: string,
  data: {
    message: string | null | undefined;
    sender: string;
    senderId: string;
  } | null
) => {
  if (data) {
    return db
      .update(chats)
      .set({
        lastMessage: {
          sender: data.sender,
          senderId: data.senderId,
          message: data.message || 'sent an image'
        },
        updatedAt: new Date().toISOString()
      })
      .where(eq(chats.id, chatId))
      .execute();
  }

  return db
    .select({ sender: users.name, senderId: users.id, message: messages.text })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(users, eq(messages.senderId, users.id))
    .limit(1)
    .orderBy(desc(messages.sentAt))
    .groupBy(messages.id, users.id)
    .execute()
    .then(([result]) => {
      const lastMessage = result
        ? {
            ...result,
            message: result.message || 'sent an image',
            sender: result.sender || '',
            senderId: result.senderId || ''
          }
        : null;
      return db
        .update(chats)
        .set({ lastMessage, updatedAt: new Date().toISOString() })
        .where(eq(chats.id, chatId))
        .execute();
    });
};

export const notifyMembersOnUpdate = async ({
  data,
  chatMembers
}: {
  chatMembers?: string[];
  data: ChatUpdatedResponse;
}) => {
  const chatId = data.chatId;
  if (!chatMembers) {
    const result = await db
      .select({ id: members.userId })
      .from(members)
      .where(eq(members.chatId, chatId));
    chatMembers = result.map((member) => member.id);
  }
  chatMembers = [...(data.removedMembers || []), ...chatMembers];

  type NotifyMembersOnChatUpdate = Omit<BatchEvent, 'data'> & {
    data: ChatUpdatedResponse;
  };
  const notifyMembers: NotifyMembersOnChatUpdate[] = chatMembers.map(
    (member) => ({
      channel: member,
      name: EVENTS.CHAT_UPDATED,
      data
    })
  );
  pusher.triggerBatch(notifyMembers);
};
