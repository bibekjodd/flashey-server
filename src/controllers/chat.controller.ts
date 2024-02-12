import { db } from '@/config/database';
import {
  addToGroupChatSchema,
  createGroupChatSchema,
  fetchChatsQuerySchema,
  removeFromGroupSchema,
  updateGroupSchema
} from '@/dtos/chat.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { chats, selectChatSnapshot } from '@/schemas/chat.schema';
import { InsertParticipant, participants } from '@/schemas/participant.schema';
import { selectUsersJSON, users } from '@/schemas/user.schema';
import { fetchChat } from '@/services/chat.service';
import { and, desc, eq, inArray } from 'drizzle-orm';

export const createGroupChat = handleAsync(async (req, res) => {
  const body = createGroupChatSchema.parse(req.body);
  if (!body.participants.includes(req.user.id)) {
    body.participants.push(req.user.id);
  }
  if (body.participants.length < 2) {
    throw new BadRequestException(
      'At least 2 users are required to create group chat'
    );
  }

  const [createdChat] = await db
    .insert(chats)
    .values({
      title: body.title,
      admin: req.user.id,
      isGroupChat: true
    })
    .returning({ id: chats.id });
  if (!createdChat) {
    throw new BadRequestException('Could not create group chat!');
  }
  const insertParticipants: InsertParticipant[] = body.participants.map(
    (participant) => ({ chatId: createdChat.id, userId: participant })
  );
  await db
    .insert(participants)
    .values(insertParticipants)
    .catch(() => {
      throw new BadRequestException('Invalid participants id provided');
    });
  const chat = await fetchChat(createdChat.id);
  return res.status(201).json({ chat });
});

export const fetchChats = handleAsync(async (req, res) => {
  const { page, page_size } = fetchChatsQuerySchema.parse(req.query);
  const offset = (page - 1) * page_size;

  const usersChat = db
    .select({ id: participants.chatId })
    .from(participants)
    .where(eq(participants.userId, req.user.id));

  const result = await db
    .select({ ...selectChatSnapshot, participants: selectUsersJSON })
    .from(chats)
    .where(inArray(chats.id, usersChat))
    .leftJoin(participants, eq(chats.id, participants.chatId))
    .leftJoin(users, eq(participants.userId, users.id))
    .groupBy(chats.id, participants.joinedAt)
    .limit(page_size)
    .offset(offset)
    .orderBy(desc(participants.joinedAt));
  return res.json({ chats: result });
});

export const accessChat = handleAsync<{ id: string }>(async (req, res) => {
  const friendsId = req.params.id;

  if (req.user.id === friendsId) {
    throw new BadRequestException("You can't chat with yourself");
  }
  const [friendExists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, friendsId))
    .limit(1);
  if (!friendExists) {
    throw new NotFoundException('Unable to access chat with unavailable user');
  }

  const chatId = [req.user.id, friendsId].sort().join('');
  let chat = await fetchChat(chatId);
  if (chat) return res.json({ chat });

  await db.insert(chats).values({ id: chatId, admin: req.user.id });
  await db.insert(participants).values([
    { chatId, userId: req.user.id },
    { chatId, userId: friendsId }
  ]);
  chat = await fetchChat(chatId);
  return res.json({ chat });
});

export const accessGroupChat = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const chat = await fetchChat(chatId);
  if (!chat)
    throw new NotFoundException(
      'The group does not exist or has been deleted!'
    );

  const canUserAccess = chat.participants.find(
    (participant) => participant.id === req.user.id
  );
  if (!canUserAccess) {
    throw new ForbiddenException(
      'You must be part of the group to access the chat'
    );
  }
  return res.json({ chat });
});

export const updateGroup = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const data = updateGroupSchema.parse(req.body);
  if (!data.image && !data.title)
    throw new BadRequestException(
      'Provide one of image or title to update group'
    );

  const [chat] = await db
    .update(chats)
    .set(data)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.admin, req.user.id),
        eq(chats.isGroupChat, true)
      )
    )
    .returning();

  if (!chat)
    throw new BadRequestException(
      'Group does not exist or you are not eligible to update group'
    );
  return res.json({ message: 'Group updated successfully' });
});

export const addToGroupChat = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const body = addToGroupChatSchema.parse(req.body);
  if (!body.participants.length)
    return res.json({ message: 'Participants added successfully' });

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.isGroupChat, true)))
    .limit(1);
  if (!chat) throw new NotFoundException('Chat does not exist');
  if (chat.admin !== req.user.id)
    throw new ForbiddenException('Only admins can add users to the chat');

  const insertParticipants: InsertParticipant[] = body.participants.map(
    (participant) => ({ chatId, userId: participant })
  );
  db.insert(participants)
    .values(insertParticipants)
    .onConflictDoNothing()
    .execute();

  return res.json({ message: 'Participants added successfully' });
});

export const removeFromGroup = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const body = removeFromGroupSchema.parse(req.body);
  if (!body.participants.length) {
    return res.json({
      message: 'Participants removed from the group successfully'
    });
  }

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.isGroupChat, true)))
    .limit(1);
  if (!chat) throw new NotFoundException('Chat does not exist');

  if (chat.admin !== req.user.id)
    throw new ForbiddenException(
      'Only admins can remove participants from the group'
    );

  if (body.participants.includes(req.user.id)) {
    db.delete(chats).where(eq(chats.id, chatId)).execute();
    return res.json({ message: 'Group deleted successfully' });
  }

  db.delete(participants)
    .where(inArray(participants.userId, body.participants))
    .execute();

  return res.json({
    message: 'Participants removed from the group successfully'
  });
});

export const deleteGroup = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const [chat] = await db
    .delete(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.admin, req.user.id),
        eq(chats.isGroupChat, true)
      )
    )
    .returning();

  if (!chat)
    throw new BadRequestException(
      'Group already deleted or you are not eligible to delete the group'
    );
  return res.json({ message: 'Group deleted successfully' });
});
