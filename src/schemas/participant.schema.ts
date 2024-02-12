import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp
} from 'drizzle-orm/pg-core';
import { chats } from './chat.schema';
import { users } from './user.schema';
import { primaryKey } from 'drizzle-orm/pg-core';

export const participants = pgTable(
  'participants',
  {
    userId: text('user_id').notNull(),
    chatId: text('chat_id').notNull(),
    joinedAt: timestamp('joined_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(participants) {
    return {
      primaryKey: primaryKey({
        name: 'participants_pkey',
        columns: [participants.chatId, participants.userId]
      }),
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [participants.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      chatReference: foreignKey({
        name: 'fk_chat_id',
        columns: [participants.chatId],
        foreignColumns: [chats.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      indexUserId: index('participants_idx_user_id').on(participants.userId),
      indexChatId: index('participants_idx_chat_id').on(participants.chatId)
    };
  }
);
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;
