import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  foreignKey,
  index,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const chats = pgTable(
  'chats',
  {
    id: text('id').notNull().$defaultFn(createId),
    name: varchar('name', { length: 40 }),
    admin: text('admin'),
    image: varchar('image', { length: 200 }),
    isGroupChat: boolean('is_group_chat').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      mode: 'string',
      withTimezone: true
    }).defaultNow(),
    lastMessage: json('last_message').$type<{
      senderId: string;
      sender: string;
      message: string;
    }>()
  },
  function constraints(chats) {
    return {
      primaryKey: primaryKey({ name: 'chats_pkey', columns: [chats.id] }),
      adminReference: foreignKey({
        name: 'fk_admin',
        columns: [chats.admin],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      indexUpdatedAt: index('chats_idx_updated_at').on(chats.updatedAt)
    };
  }
);

export type Chat = typeof chats.$inferSelect;
export const selectChatSnapshot = {
  id: chats.id,
  name: chats.name,
  admin: chats.admin,
  image: chats.image,
  isGroupChat: chats.isGroupChat,
  createdAt: chats.createdAt,
  updatedAt: chats.updatedAt,
  lastMessage: chats.lastMessage
};
