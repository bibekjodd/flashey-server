import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  foreignKey,
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
    title: varchar('title', { length: 40 }),
    admin: text('admin').notNull(),
    image: varchar('image', { length: 255 }),
    isGroupChat: boolean('is_group_chat').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(chats) {
    return {
      primaryKey: primaryKey({ name: 'chats_pkey', columns: [chats.id] }),
      adminReference: foreignKey({
        name: 'fk_admin',
        columns: [chats.admin],
        foreignColumns: [users.id]
      })
    };
  }
);

export type Chat = typeof chats.$inferSelect;
export const selectChatSnapshot = {
  id: chats.id,
  title: chats.title,
  image: chats.image,
  admin: chats.admin,
  isGroupChat: chats.isGroupChat,
  createdAt: chats.createdAt
};
