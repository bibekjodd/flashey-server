import { db } from '@/config/database';
import {
  getFriendsListSchema,
  loginUserSchema,
  queryUsersSchema,
  registerUserSchema,
  updateProfileSchema
} from '@/dtos/user.dto';
import { BadRequestException, UnauthorizedException } from '@/lib/exceptions';
import {
  cookieOptions,
  generateAuthToken,
  hashPassword,
  verifyPassword
} from '@/lib/utils';
import { handleAsync } from '@/middlewares/handle-async';
import { chats } from '@/schemas/chat.schema';
import { members } from '@/schemas/member.schema';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { and, desc, eq, ilike, inArray, ne, or } from 'drizzle-orm';

export const registerUser = handleAsync(async (req, res) => {
  const body = registerUserSchema.parse(req.body);
  const [userExists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);
  if (userExists) {
    throw new BadRequestException('User with same email already exists');
  }
  const hashedPassword = await hashPassword(body.password);
  const [createdUser] = await db
    .insert(users)
    .values({ ...body, password: hashedPassword })
    .returning(selectUserSnapshot);
  if (!createdUser) {
    throw new BadRequestException('Could not register user');
  }
  return res.status(201).json({ user: createdUser });
});

export const loginUser = handleAsync(async (req, res) => {
  const body = loginUserSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  const exception = new BadRequestException('Invalid credentials provided');
  if (!user) throw exception;
  const isValidPassword = await verifyPassword(
    body.password,
    user.password || ''
  );
  if (!isValidPassword) throw exception;

  const token = generateAuthToken(user.id);
  return res
    .cookie('token', token, cookieOptions)
    .json({ user: { ...user, password: undefined } });
});

export const getFriendsList = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const { page, page_size } = getFriendsListSchema.parse(req.query);
  const offset = (page - 1) * page_size;
  const sq = db
    .select({ chatId: members.chatId })
    .from(members)
    .where(eq(members.userId, req.user.id))
    .innerJoin(
      chats,
      and(eq(chats.id, members.chatId), eq(chats.isGroupChat, false))
    )
    .groupBy(members.chatId);

  const result = await db
    .select(selectUserSnapshot)
    .from(users)
    .innerJoin(
      members,
      and(
        eq(members.userId, users.id),
        ne(members.userId, req.user.id),
        inArray(members.chatId, sq)
      )
    )
    .limit(page_size)
    .offset(offset)
    .orderBy(desc(users.lastOnline));
  return res.json({ friends: result });
});

export const queryUsers = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const { q, page, page_size } = queryUsersSchema.parse(req.query);
  const offset = (page - 1) * page_size;
  let result = await db
    .select(selectUserSnapshot)
    .from(users)
    .where(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)))
    .limit(page_size)
    .offset(offset);
  result = result.filter((user) => user.id !== req.user?.id);
  return res.json({ users: result });
});

export const getProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  return res.json({ user: req.user });
});

export const getUserProfile = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const userId = req.params.id;
  const [user] = await db
    .select({ ...selectUserSnapshot })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    throw new BadRequestException('User does not exist');
  }
  return res.json({ user });
});

export const updateProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const { name, image } = updateProfileSchema.parse(req.body);
  db.update(users)
    .set({ name, image })
    .where(eq(users.id, req.user.id))
    .execute();
  return res.json({ message: 'Profile updated successfully' });
});

export const logoutUser = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  req.session.destroy(() => {});
  req.logout(() => {});
  return res.json({ message: 'Logged out successfully' });
});

export const deleteProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  await db.delete(users).where(eq(users.id, req.user.id));
  req.session.destroy(() => {});
  req.logout(() => {});
  return res.json({ message: 'Profile deleted successfully' });
});
