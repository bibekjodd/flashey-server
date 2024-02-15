import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core';
import { chats } from './chat.schema';
import { users } from './user.schema';

export const members = pgTable(
  'members',
  {
    userId: text('user_id').notNull(),
    chatId: text('chat_id').notNull(),
    joinedAt: timestamp('joined_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(members) {
    return {
      primaryKey: primaryKey({
        name: 'members_pkey',
        columns: [members.chatId, members.userId]
      }),
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [members.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      chatReference: foreignKey({
        name: 'fk_chat_id',
        columns: [members.chatId],
        foreignColumns: [chats.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      indexUserId: index('members_idx_user_id').on(members.userId),
      indexChatId: index('members_idx_chat_id').on(members.chatId)
    };
  }
);
export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;
