import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { chats } from './chat.schema';
import { users } from './user.schema';

export const messages = pgTable(
  'messages',
  {
    id: text('id').notNull().$defaultFn(createId),
    text: varchar('text', { length: 500 }),
    image: varchar('image', { length: 255 }),
    chatId: text('chat_id').notNull(),
    senderId: text('sender_id').notNull(),
    isEdited: boolean('is_edited').notNull().default(false),
    sentAt: timestamp('sent_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(messages) {
    return {
      primaryKey: primaryKey({ name: 'messages_pkey', columns: [messages.id] }),
      senderReference: foreignKey({
        name: 'fk_user_id',
        columns: [messages.senderId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      chatReference: foreignKey({
        name: 'fk_chat_id',
        columns: [messages.chatId],
        foreignColumns: [chats.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      indexChatId: index('messages_idx_chat_id').on(messages.chatId)
    };
  }
);

export const selectMessageSnapshot = {
  id: messages.id,
  text: messages.text,
  image: messages.image,
  chatId: messages.chatId,
  senderId: messages.senderId,
  isEdited: messages.isEdited,
  sentAt: messages.sentAt
};
