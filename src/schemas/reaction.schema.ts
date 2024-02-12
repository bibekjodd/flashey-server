import { validReactions } from '@/dtos/common.dto';
import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  varchar
} from 'drizzle-orm/pg-core';
import { messages } from './message.schema';
import { users } from './user.schema';

export const reactions = pgTable(
  'reactions',
  {
    userId: text('user_id').notNull(),
    messageId: text('message_id').notNull(),
    reaction: varchar('reaction', {
      enum: validReactions,
      length: 20
    }).notNull()
  },
  function constraints(reactions) {
    return {
      primaryKey: primaryKey({
        name: 'reactions_pkey',
        columns: [reactions.userId, reactions.messageId]
      }),
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [reactions.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      messageReference: foreignKey({
        name: 'fk_message_id',
        columns: [reactions.messageId],
        foreignColumns: [messages.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),

      indexUser: index('reactions_idx_user_id').on(reactions.userId),
      indexMessage: index('reactions_idx_message_id').on(reactions.messageId)
    };
  }
);
