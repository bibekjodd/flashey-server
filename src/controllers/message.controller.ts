import { db } from '@/config/database';
import {
  editMessageSchema,
  fetchMessagesQuery,
  sendMessageSchema
} from '@/dtos/message.dto';
import { BadRequestException, ForbiddenException } from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { messages, selectMessageSnapshot } from '@/schemas/message.schema';
import { participants } from '@/schemas/participant.schema';
import { reactions } from '@/schemas/reaction.schema';
import { viewers } from '@/schemas/viewer.schema';
import { and, countDistinct, desc, eq, sql } from 'drizzle-orm';

export const sendMessage = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const [canSendMessage] = await db
    .select()
    .from(participants)
    .where(
      and(eq(participants.userId, req.user.id), eq(participants.chatId, chatId))
    )
    .limit(1);

  if (!canSendMessage)
    throw new ForbiddenException('You do not belong to this chat');

  const { image, text } = sendMessageSchema.parse(req.body);
  db.insert(messages)
    .values({
      chatId,
      senderId: req.user.id,
      image,
      text
    })
    .execute();
  return res.status(201).json({ message: 'Message sent successfully' });
});

export const fetchMessages = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const [isParticipant] = await db
    .select()
    .from(participants)
    .where(
      and(eq(participants.chatId, chatId), eq(participants.userId, req.user.id))
    );
  if (!isParticipant) {
    throw new ForbiddenException(
      'You are not eligible to access messages from this chat'
    );
  }
  const { page, page_size } = fetchMessagesQuery.parse(req.query);
  const offset = (page - 1) * page_size;
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
    .where(eq(messages.chatId, chatId))
    .leftJoin(viewers, eq(messages.id, viewers.messageId))
    .leftJoin(reactions, eq(messages.id, reactions.messageId))
    .groupBy(messages.id)
    .orderBy(desc(messages.sentAt))
    .limit(page_size)
    .offset(offset);

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
  const messageId = req.params.id;
  const [message] = await db
    .select({ participants: sql<string[]>`array_agg(${participants.userId})` })
    .from(messages)
    .where(eq(messages.id, messageId))
    .leftJoin(
      participants,
      and(
        eq(participants.chatId, messages.chatId),
        eq(participants.userId, req.user.id)
      )
    )
    .limit(1);

  if (!message || !message.participants.includes(req.user.id))
    throw new ForbiddenException(
      'You are not allowed to update activity on this chat'
    );

  await db
    .insert(viewers)
    .values({ messageId, userId: req.user.id })
    .onConflictDoNothing();

  return res.json({ message: 'Message seen updated successfully' });
});

export const editMessage = handleAsync<{ id: string }>(async (req, res) => {
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
  return res.json({ message: 'Message edited successfully' });
});

export const deleteMessage = handleAsync<{ id: string }>(async (req, res) => {
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
  return res.json({ message: 'Message deleted successfully' });
});
