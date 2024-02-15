import { Reaction } from '@/dtos/common.dto';

export const EVENTS = {
  GROUP_CREATED: 'group-created',
  ADDED_TO_GROUP: 'added-to-group',
  GROUP_UPDATED: 'gruop-updated',
  REMOVED_FROM_GROUP: 'removed-from-group',
  GROUP_DELETED: 'group-deleted',

  MESSAGE_SENT: 'message-sent',
  MESSAGE_SEEN: 'message-seen',
  REACTION_ADDED: 'reaction-added',
  MESSAGE_DELETED: 'message-deleted',

  USER_ONLINE: 'user-online'
};

export type GroupCreatedResponse = {
  chatId: string;
};
export type AddedToGroupResponse = {
  chatId: string;
};
export type GroupUpdatedResponse = {
  name?: string;
  image?: string | null;
  removedMembersId?: string[];
  addedMembersId?: string[];
};
export type RemovedFromGroupResponse = {
  removedMembersId: string[];
};
export type GroupDeletedResponse = unknown;
export type MessageSentResponse = {
  senderId: string;
  text?: string | null;
  image?: string | null;
};
export type MessageSeenResponse = {
  messageId: string;
  userId: string;
};
export type MessageDeletedResponse = {
  messageId: string;
};
export type ReactionAddedResponse = {
  messageId: string;
  reaction: Reaction;
  userId: string;
};
export type UserOnlineResponse = unknown;
