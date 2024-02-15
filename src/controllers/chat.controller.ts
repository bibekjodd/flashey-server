import { db } from '@/config/database';
import { pusher } from '@/config/pusher';
import {
  addToGroupChatSchema,
  createGroupChatSchema,
  fetchChatsQuerySchema,
  removeFromGroupSchema,
  updateGroupSchema
} from '@/dtos/chat.dto';
import {
  AddedToGroupResponse,
  EVENTS,
  GroupCreatedResponse,
  GroupDeletedResponse,
  GroupUpdatedResponse,
  RemovedFromGroupResponse
} from '@/lib/events';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { chats, selectChatSnapshot } from '@/schemas/chat.schema';
import { InsertMember, members } from '@/schemas/member.schema';
import { selectUsersJSON, users } from '@/schemas/user.schema';
import { fetchChat } from '@/services/chat.service';
import { and, count, desc, eq, inArray } from 'drizzle-orm';

export const createGroupChat = handleAsync(async (req, res) => {
  const body = createGroupChatSchema.parse(req.body);
  if (!body.members.includes(req.user.id)) {
    body.members.push(req.user.id);
  }
  if (body.members.length < 2) {
    throw new BadRequestException(
      'At least 2 users are required to create group chat'
    );
  }

  const [createdChat] = await db
    .insert(chats)
    .values({
      name: body.name,
      admin: req.user.id,
      isGroupChat: true,
      lastMessage: {
        sender: req.user.name,
        senderId: req.user.id,
        message: 'created group'
      }
    })
    .returning({ id: chats.id });
  if (!createdChat) {
    throw new BadRequestException('Could not create group chat!');
  }
  const insertMembers: InsertMember[] = body.members.map((member) => ({
    chatId: createdChat.id,
    userId: member
  }));
  await db
    .insert(members)
    .values(insertMembers)
    .catch(() => {
      db.delete(chats).where(eq(chats.id, createdChat.id)).execute();
      throw new BadRequestException('Invalid members id provided');
    });

  // notify users
  for (const member of insertMembers) {
    pusher.trigger(member.userId, EVENTS.GROUP_CREATED, {
      chatId: createdChat.id
    } satisfies GroupCreatedResponse);
  }
  const chat = await fetchChat(createdChat.id);
  return res.status(201).json({ chat });
});

export const fetchChats = handleAsync(async (req, res) => {
  const { page, page_size } = fetchChatsQuerySchema.parse(req.query);
  const offset = (page - 1) * page_size;

  const usersChat = db
    .select({ id: members.chatId })
    .from(members)
    .where(eq(members.userId, req.user.id));

  const result = await db
    .select({
      ...selectChatSnapshot,
      members: selectUsersJSON
    })
    .from(chats)
    .where(inArray(chats.id, usersChat))
    .leftJoin(members, eq(chats.id, members.chatId))
    .leftJoin(users, eq(members.userId, users.id))
    .groupBy(chats.id)
    .limit(page_size)
    .offset(offset)
    .orderBy(desc(chats.updatedAt));
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

  await db.insert(chats).values({ id: chatId });
  await db.insert(members).values([
    { chatId, userId: req.user.id },
    { chatId, userId: friendsId }
  ]);
  pusher.trigger(friendsId, EVENTS.GROUP_CREATED, {
    chatId: chatId
  } satisfies GroupCreatedResponse);
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

  const canUserAccess = chat.members.find(
    (member) => member.id === req.user.id
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
  if (!data.image && !data.name)
    throw new BadRequestException(
      'Provide one of image or name to update group'
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

  // notify members
  pusher.trigger(chatId, EVENTS.GROUP_UPDATED, {
    name: data.image || undefined,
    image: data.image
  } satisfies GroupUpdatedResponse);

  if (!chat)
    throw new BadRequestException(
      'Group does not exist or you are not eligible to update group'
    );
  return res.json({ message: 'Group updated successfully' });
});

export const addToGroupChat = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const body = addToGroupChatSchema.parse(req.body);
  if (!body.members.length)
    return res.json({ message: 'Members added successfully' });

  const [chat] = await db
    .select({
      id: chats.id,
      admin: chats.admin,
      totalMembers: count(members.userId)
    })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.isGroupChat, true)))
    .leftJoin(members, eq(chats.id, members.chatId))
    .groupBy(chats.id)
    .limit(1);
  if (!chat) throw new NotFoundException('Chat does not exist');
  if (chat.admin !== req.user.id)
    throw new ForbiddenException('Only admins can add users to the chat');

  if (chat.totalMembers + body.members.length > 10) {
    throw new BadRequestException("Group can't have more than 10 members");
  }

  const insertMembers: InsertMember[] = body.members.map((member) => ({
    chatId,
    userId: member
  }));
  await db
    .insert(members)
    .values(insertMembers)
    .catch(() => {
      throw new BadRequestException('Invalid member id provided');
    });

  // notify members
  const addedMembersId = insertMembers.map((member) => member.userId);
  pusher.trigger(chatId, EVENTS.GROUP_UPDATED, {
    addedMembersId
  } satisfies GroupUpdatedResponse);
  // notify users
  for (const member of addedMembersId) {
    pusher.trigger(member, EVENTS.ADDED_TO_GROUP, {
      chatId
    } satisfies AddedToGroupResponse);
  }

  return res.json({ message: 'Members added successfully' });
});

export const removeFromGroup = handleAsync<{ id: string }>(async (req, res) => {
  const chatId = req.params.id;
  const body = removeFromGroupSchema.parse(req.body);
  if (!body.members.length) {
    return res.json({
      message: 'Members removed from the group successfully'
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
      'Only admins can remove members from the group'
    );

  if (body.members.includes(req.user.id)) {
    db.delete(chats).where(eq(chats.id, chatId)).execute();
    return res.json({ message: 'Group deleted successfully' });
  }

  db.delete(members).where(inArray(members.userId, body.members)).execute();
  // notify members
  pusher.trigger(chatId, EVENTS.REMOVED_FROM_GROUP, {
    removedMembersId: body.members
  } satisfies RemovedFromGroupResponse);

  return res.json({
    message: 'Members removed from the group successfully'
  });
});

export const deleteChat = handleAsync<{ id: string }>(async (req, res) => {
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

  // notify members
  pusher.trigger(
    chatId,
    EVENTS.GROUP_DELETED,
    {} satisfies GroupDeletedResponse
  );
  return res.json({ message: 'Group deleted successfully' });
});
