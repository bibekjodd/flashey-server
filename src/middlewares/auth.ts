import { db } from '@/config/database';
import { ForbiddenException, UnauthorizedException } from '@/lib/exceptions';
import { decodeAuthToken } from '@/lib/utils';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { eq } from 'drizzle-orm';
import { handleAsync } from './handle-async';

export const isAuthenticated = handleAsync(async (req, res, next) => {
  const token = req.cookies?.token;
  const unauthorizedException = new UnauthorizedException(
    'Please login to access this resource'
  );
  if (!token) throw unauthorizedException;

  const userId = decodeAuthToken(token);
  if (!userId) throw unauthorizedException;

  const [user] = await db
    .select(selectUserSnapshot)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw unauthorizedException;

  req.user = user;
  next();
});

export const isAdmin = handleAsync(async (req, res, next) => {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenException('Only admin can access this resource');
  }
  next();
});
