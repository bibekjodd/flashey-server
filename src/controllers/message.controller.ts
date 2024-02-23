import { db } from '@/config/database';
import { pusher } from '@/config/pusher';
import {
  editMessageSchema,
  fetchMessagesQuery,
  sendMessageSchema
} from '@/dtos/message.dto';
import {
  EVENTS,
  MessageDeletedResponse,
  MessageSeenResponse,
  MessageTypingResponse
} from '@/lib/events';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { chats } from '@/schemas/chat.schema';
import { members } from '@/schemas/member.schema';
import { messages, selectMessageSnapshot } from '@/schemas/message.schema';
import { reactions } from '@/schemas/reaction.schema';
import { viewers } from '@/schemas/viewer.schema';
import { updateLastMessageOnChat } from '@/services/chat.service';
import { and, countDistinct, desc, eq, lt, sql } from 'drizzle-orm';
import { BatchEvent } from 'pusher';

export const updateTypingStatus = handleAsync<{ id: string }>(
  async (req, res) => {
    if (!req.user) throw new UnauthorizedException();
    const chatId = req.params.id;

    const [canUpdate] = await db
      .select()
      .from(members)
      .where(and(eq(members.userId, req.user.id), eq(members.chatId, chatId)))
      .limit(1);

    if (!canUpdate)
      throw new ForbiddenException(
        'Your are not allowed to perform action on this chat'
      );

    // notify user/members
    pusher.trigger(chatId, EVENTS.MESSAGE_TYPING, {
      user: req.user.id
    } satisfies MessageTypingResponse);
    return res.json({ message: 'Typing status updated successfully' });
  }
);

export const sendMessage = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const chatId = req.params.id;
  const chatMembers = await db
    .select({ userId: members.userId })
    .from(members)
    .where(eq(members.chatId, chatId));

  const canSendMessage = chatMembers.find(
    ({ userId }) => userId === req.user?.id
  );
  if (!canSendMessage)
    throw new ForbiddenException('You do not belong to this chat');

  const { image, text } = sendMessageSchema.parse(req.body);
  const [message] = await db
    .insert(messages)
    .values({
      chatId,
      senderId: req.user.id,
      image,
      text
    })
    .returning()
    .execute();

  updateLastMessageOnChat(chatId, {
    message: text,
    sender: req.user.name,
    senderId: req.user.id
  });

  // notify user/members
  const membersIds = chatMembers.map((member) => member.userId);
  const notifyMembers: BatchEvent[] = membersIds.map((id) => ({
    channel: id,
    name: EVENTS.MESSAGE_SENT,
    data: {
      ...message,
      totalViews: 0,
      totalReactions: 0,
      viewers: [],
      reactions: []
    }
  }));
  pusher.triggerBatch(notifyMembers);

  return res.status(201).json({
    message: {
      ...message,
      viewers: [],
      reactions: [],
      totalViews: 0,
      totalReactions: 0
    }
  });
});

export const fetchMessage = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const messageId = req.params.id;

  const [message] = await db
    .select({
      ...selectMessageSnapshot,
      viewers: sql`json_agg(distinct(${viewers.userId}))`,
      reactions: sql`json_agg(json_build_object('userId',${reactions.userId},'reaction',${reactions.reaction}))`
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(
      members,
      and(eq(chats.id, members.chatId), eq(members.userId, req.user.id))
    )
    .leftJoin(viewers, eq(messages.id, viewers.messageId))
    .leftJoin(reactions, eq(messages.id, reactions.messageId))
    .groupBy(messages.id);
  if (!message) {
    throw new BadRequestException(
      'Message does not exist of you are not allowed to read this message'
    );
  }

  return res.json({ message });
});

export const fetchMessages = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const chatId = req.params.id;
  const [isMember] = await db
    .select()
    .from(members)
    .where(and(eq(members.chatId, chatId), eq(members.userId, req.user.id)));
  if (!isMember) {
    throw new ForbiddenException(
      'You are not eligible to access messages from this chat'
    );
  }
  const { cursor, limit } = fetchMessagesQuery.parse(req.query);
  // const offset = (page - 1) * page_size;
  const result = await db
    .select({
      ...selectMessageSnapshot,
      totalViews: countDistinct(viewers.userId),
      totalReactions: countDistinct(reactions.userId),
      viewers: sql<string[]>`array_agg(${viewers.userId})`,
      reactions: sql<
        ({
          userId: string | null;
          reaction: string | null;
        } | null)[]
      >`json_agg(
        json_build_object(
          'userId',${reactions.userId},
          'reaction',${reactions.reaction}
          )
        )`
    })
    .from(messages)
    .where(and(eq(messages.chatId, chatId), lt(messages.sentAt, cursor)))
    .leftJoin(viewers, eq(messages.id, viewers.messageId))
    .leftJoin(reactions, eq(messages.id, reactions.messageId))
    .groupBy(messages.id)
    .orderBy(desc(messages.sentAt))
    .limit(limit);

  for (const message of result) {
    message.viewers = [...new Set(message.viewers)];
    message.viewers = message.viewers.filter(
      (viewer) => viewer.toLocaleLowerCase() !== 'null'
    );
    const includedReactions: string[] = [];
    message.reactions = message.reactions.filter((reaction) => {
      if (reaction?.userId && !includedReactions.includes(reaction.userId)) {
        includedReactions.push(reaction.userId);
        return true;
      }
      return false;
    });
  }
  return res.json({ total: result.length, messages: result });
});

export const messageSeen = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const messageId = req.params.id;
  const [message] = await db
    .select({
      members: sql<string[]>`array_agg(${members.userId})`,
      chatId: messages.chatId
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .leftJoin(
      members,
      and(eq(members.chatId, messages.chatId), eq(members.userId, req.user.id))
    )
    .limit(1);

  if (!message || !message.members.includes(req.user.id))
    throw new ForbiddenException(
      'You are not allowed to update activity on this chat'
    );

  await db
    .insert(viewers)
    .values({ messageId, userId: req.user.id })
    .onConflictDoNothing();

  // notify user/members
  pusher.trigger(message.chatId, EVENTS.MESSAGE_SEEN, {
    messageId,
    userId: req.user.id
  } satisfies MessageSeenResponse);

  return res.json({ message: 'Message seen updated successfully' });
});

export const editMessage = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const messageId = req.params.id;
  const { text, image } = editMessageSchema.parse(req.body);
  const [edited] = await db
    .update(messages)
    .set({ text, image, isEdited: true })
    .where(and(eq(messages.id, messageId), eq(messages.senderId, req.user.id)))
    .returning();

  if (!edited) {
    throw new BadRequestException(
      'Message does not exist or you are not allowed to edit others message'
    );
  }

  updateLastMessageOnChat(edited.chatId, null);

  return res.json({ message: 'Message edited successfully' });
});

export const deleteMessage = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const messageId = req.params.id;
  const [deleted] = await db
    .delete(messages)
    .where(and(eq(messages.id, messageId), eq(messages.senderId, req.user.id)))
    .returning();

  if (!deleted) {
    throw new BadRequestException(
      'Message is already deleted or you are not allowed to delete this message!'
    );
  }
  updateLastMessageOnChat(deleted.chatId, {
    message: 'deleted a message',
    sender: req.user.name,
    senderId: req.user.id
  });
  // notify user/members
  pusher.trigger(deleted.chatId, EVENTS.MESSAGE_DELETED, {
    messageId,
    sender: req.user.name,
    senderId: req.user.id
  } satisfies MessageDeletedResponse);
  return res.json({ message: 'Message deleted successfully' });
});
