import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text
} from 'drizzle-orm/pg-core';
import { messages } from './message.schema';
import { users } from './user.schema';

export const viewers = pgTable(
  'viewers',
  {
    userId: text('user_id').notNull(),
    messageId: text('message_id').notNull()
  },
  function constraints(viewers) {
    return {
      primaryKey: primaryKey({
        name: 'viewers_pkey',
        columns: [viewers.userId, viewers.messageId]
      }),
      viewerReference: foreignKey({
        name: 'fk_user_id',
        columns: [viewers.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      messageReference: foreignKey({
        name: 'fk_message_id',
        columns: [viewers.messageId],
        foreignColumns: [messages.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),

      indexViewer: index('viewers_idx_user_id').on(viewers.userId),
      indexMessage: index('viewers_idx_message_id').on(viewers.messageId)
    };
  }
);
