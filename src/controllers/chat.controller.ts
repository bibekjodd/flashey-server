import { db } from '@/config/database';
import { pusher } from '@/config/pusher';
import {
  createGroupChatSchema,
  fetchChatsQuerySchema,
  updateChatSchema
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
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';

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
  const chat = await fetchChat(chatId);
  if (!chat) throw new NotFoundException("Chat doesn't exist");

  const canUpdatechat = chat.admin === req.user.id;
  if (!canUpdatechat)
    throw new ForbiddenException('Only admin can update the chat');

  if (!chat.isGroupChat) {
    throw new ForbiddenException('Only group chats can be updated');
  }

  const data = updateChatSchema.parse(req.body);
  const { name, image } = data;
  const addMembers = data.addMembers || [];
  const removeMembers = data.removeMembers || [];

  if (removeMembers.includes(req.user.id))
    throw new ForbiddenException("Admin can't remove themselves from chat");

  console.log(addMembers);
  const newMembers = addMembers.filter((member) => {
    const isAlreadyAdded = chat.members.find(({ id }) => id === member);
    if (isAlreadyAdded) return false;
    return !removeMembers.includes(member);
  });

  if (newMembers.length + chat.members.length > 10)
    throw new BadRequestException("Chat can't have more than 10 members");

  const promises: Promise<unknown>[] = [];

  // update title/image
  if (data.image || data.name) {
    promises.push(
      db
        .update(chats)
        .set({ name, image })
        .where(eq(chats.id, chatId))
        .execute()
    );
  }

  // add members
  const insertMembers: InsertMember[] = newMembers.map((member) => ({
    chatId,
    userId: member
  }));
  if (insertMembers.length) {
    promises.push(
      db.insert(members).values(insertMembers).onConflictDoNothing().execute()
    );
  }

  // remove members
  if (removeMembers.length) {
    promises.push(
      db
        .delete(members)
        .where(
          and(
            inArray(members.userId, removeMembers),
            eq(members.chatId, chatId)
          )
        )
        .execute()
    );
  }

  await Promise.all(promises);
  const updatedChat = await fetchChat(chatId);
  const chatMembers = updatedChat?.members.map((member) => member.id);
  // notify members
  notifyMembersOnUpdate({
    chatMembers: chatMembers || [],
    data: {
      chatId,
      addedMembers: newMembers,
      image,
      name,
      removedMembers: removeMembers
    }
  });
  return res.json({ chat: updatedChat });
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
