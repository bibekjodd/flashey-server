import { db } from '@/config/database';
import { validReactionsSchema } from '@/dtos/common.dto';
import { BadRequestException, ForbiddenException } from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { chats } from '@/schemas/chat.schema';
import { messages } from '@/schemas/message.schema';
import { participants } from '@/schemas/participant.schema';
import { reactions } from '@/schemas/reaction.schema';
import { and, eq } from 'drizzle-orm';

export const addReaction = handleAsync<
  { id: string },
  unknown,
  { reaction: unknown }
>(async (req, res) => {
  const messageId = req.params.id;
  const reaction = validReactionsSchema.nullable().parse(req.body?.reaction);

  if (!reaction) {
    const [deleted] = await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.userId, req.user.id),
          eq(reactions.messageId, messageId)
        )
      )
      .returning();

    if (!deleted) {
      throw new BadRequestException(
        'Reaction already deleted or you are not eligible to remove reaction'
      );
    }

    return res.json({ message: 'Reaction removed successfully' });
  }

  const [message] = await db
    .select({ eligibleUser: participants.userId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .leftJoin(chats, eq(messages.chatId, chats.id))
    .leftJoin(
      participants,
      and(
        eq(chats.id, participants.chatId),
        eq(participants.userId, req.user.id)
      )
    );

  if (message?.eligibleUser !== req.user.id) {
    throw new ForbiddenException(
      'Message does not exist or you are not part of the group to react to the message'
    );
  }

  db.insert(reactions)
    .values({ messageId, reaction, userId: req.user.id })
    .onConflictDoUpdate({
      target: [reactions.userId, reactions.messageId],
      set: { reaction }
    })
    .execute();

  return res.json({ message: 'Reaction added successfully' });
});
