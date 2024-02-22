import { Reaction } from '@/dtos/common.dto';

export const EVENTS = {
  CHAT_UPDATED: 'chat-updated',
  CHAT_DELETED: 'chat-deleted',

  MESSAGE_TYPING: 'message-typing',
  MESSAGE_SENT: 'message-sent',
  MESSAGE_SEEN: 'message-seen',
  REACTION_ADDED: 'reaction-added',
  MESSAGE_DELETED: 'message-deleted',

  USER_ONLINE: 'user-online'
};

export type ChatUpdatedResponse = {
  chatId: string;
  name?: string;
  image?: string | null;
  removedMembers?: string[];
  addedMembers?: string[];
};
export type ChatDeletedResponse = unknown;
export type MessageTypingResponse = {
  user: string;
};
export type MessageSentResponse = unknown;
export type MessageSeenResponse = {
  messageId: string;
  userId: string;
};
export type MessageDeletedResponse = {
  messageId: string;
  sender: string;
  senderId: string;
};
export type ReactionAddedResponse = {
  messageId: string;
  reaction: Reaction;
  userId: string;
};
export type UserOnlineResponse = unknown;
