import { db } from '@/config/database';
import { pusher } from '@/config/pusher';
import {
  addToGroupChatSchema,
  createGroupChatSchema,
  fetchChatsQuerySchema,
  removeFromGroupSchema,
  updateGroupSchema
} from '@/dtos/chat.dto';
import { ChatDeletedResponse, EVENTS } from '@/lib/events';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { chats, selectChatSnapshot } from '@/schemas/chat.schema';
import { InsertMember, members } from '@/schemas/member.schema';
import { selectUsersJSON, users } from '@/schemas/user.schema';
import { fetchChat, notifyMembersOnUpdate } from '@/services/chat.service';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

export const createGroupChat = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
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

  notifyMembersOnUpdate({
    data: { addedMembers: body.members, chatId: createdChat.id },
    chatMembers: body.members
  });
  const chat = await fetchChat(createdChat.id);
  return res.status(201).json({ chat });
});

export const accessChat = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  let chatId = req.params.id;
  const isGroupchat = !chatId.includes(req.user.id);
  if (!isGroupchat) {
    const friendsId = chatId.split(req.user.id).join('');
    const friend = await db
      .select()
      .from(users)
      .where(eq(users.id, friendsId))
      .limit(1);
    if (!friend) throw new NotFoundException("User doesn't exist");
    chatId = [req.user.id, friendsId].sort().join('');
    let chat = await fetchChat(chatId);
    if (!chat) {
      await db.insert(chats).values({ id: chatId });
      await db.insert(members).values([
        { chatId, userId: req.user.id },
        { chatId, userId: friendsId }
      ]);
      notifyMembersOnUpdate({
        data: { chatId, addedMembers: [req.user.id, friendsId] },
        chatMembers: [req.user.id, friendsId]
      });
    }
    chat = await fetchChat(chatId);
    return res.json({ chat });
  }

  const chat = await fetchChat(chatId);
  if (!chat) throw new NotFoundException("Chat doesn't exist");
  const canAccessChat = chat.members.find(
    (member) => member.id === req.user?.id
  );
  if (!canAccessChat)
    throw new ForbiddenException('You are not allowed to access this chat');
  return res.json({ chat });
});

export const fetchChats = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const { cursor, limit } = fetchChatsQuerySchema.parse(req.query);

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
    .where(and(inArray(chats.id, usersChat), lt(chats.updatedAt, cursor)))
    .leftJoin(members, eq(chats.id, members.chatId))
    .leftJoin(users, eq(members.userId, users.id))
    .groupBy(chats.id)
    .limit(limit)
    .orderBy(desc(chats.updatedAt));
  return res.json({ total: result.length, chats: result });
});

export const updateChat = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const chatId = req.params.id;
  const { name, image } = updateGroupSchema.parse(req.body);
  if (!image && !name)
    throw new BadRequestException(
      'Provide one of image or name to update group'
    );

  const [chat] = await db
    .update(chats)
    .set({ name, image })
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

  notifyMembersOnUpdate({ data: { chatId, name: name, image: image } });
  return res.json({ message: 'Group updated successfully' });
});

export const addToGroupChat = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const chatId = req.params.id;
  const body = addToGroupChatSchema.parse(req.body);
  if (!body.members.length)
    return res.json({ message: 'Members added successfully' });

  const [chat] = await db
    .select({
      id: chats.id,
      admin: chats.admin,
      members: sql<string[]>`array_agg(${members.userId})`
    })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.isGroupChat, true)))
    .leftJoin(members, eq(chats.id, members.chatId))
    .groupBy(chats.id)
    .limit(1);
  if (!chat) throw new NotFoundException('Chat does not exist');
  if (chat.admin !== req.user.id)
    throw new ForbiddenException('Only admins can add users to the chat');

  if (chat.members.length + body.members.length > 10) {
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
  const chatMembers = [...body.members, ...chat.members];
  notifyMembersOnUpdate({
    chatMembers,
    data: { chatId, addedMembers: body.members }
  });

  return res.json({ message: 'Members added successfully' });
});

export const removeFromGroup = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
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
    return res.json({ message: 'Chat deleted successfully' });
  }

  db.delete(members).where(inArray(members.userId, body.members)).execute();
  // notify members
  notifyMembersOnUpdate({ data: { chatId, removedMembers: body.members } });

  return res.json({
    message: 'Members removed from the chat successfully'
  });
});

export const deleteChat = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const chatId = req.params.id;
  const [chat] = await db
    .delete(chats)
    .where(
      or(
        and(eq(chats.id, chatId), eq(chats.isGroupChat, false)),
        and(
          eq(chats.id, chatId),
          eq(chats.admin, req.user.id),
          eq(chats.isGroupChat, true)
        )
      )
    )
    .returning();

  if (!chat)
    throw new BadRequestException(
      'Chat already deleted or you are not eligible to delete the chat'
    );

  // notify members
  pusher.trigger(chatId, EVENTS.CHAT_DELETED, {} satisfies ChatDeletedResponse);
  return res.json({ message: 'Chat deleted successfully' });
});
