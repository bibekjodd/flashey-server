import { uploadMessagePicture } from "../lib/cloudinary";
import { EVENTS, validReactions } from "../lib/constants";
import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import Chat from "../models/Chat.Model";
import Message from "../models/Message.Model";

export const sendMessage = catchAsyncError<
  { chatId: string },
  unknown,
  { text?: string; image?: string }
>(async (req, res, next) => {
  const { chatId } = req.params;
  const { text, image } = req.body;

  if (!text && !image) {
    return next(new ErrorHandler("Message must contain text or image", 400));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler("Chat doesn't exist", 400));
  }

  if (!chat.users.includes(req.user._id.toString())) {
    return next(new ErrorHandler("You do not belong to this chat", 400));
  }

  const message = new Message({
    chat: chatId,
    sender: req.user._id.toString(),
    viewers: [req.user._id.toString()],
  });
  if (text) {
    message.text = text;
  }

  if (image) {
    const { public_id, url } = await uploadMessagePicture(image);
    message.image = {
      public_id,
      url,
    };
  }

  await message.save();
  pusher.trigger(chat._id.toString(), EVENTS.MESSAGE_SENT, message);

  await Chat.findByIdAndUpdate(chatId, {
    $set: {
      latestMessage: message._id.toString(),
    },
  });

  return res.status(200).json({ message: messages.send_message_success });
});

export const updateMessageViewer = catchAsyncError<
  unknown,
  unknown,
  unknown,
  { messageId: string; chatId: string }
>(async (req, res, next) => {
  const viewerId = req.user?._id.toString();
  const { messageId, chatId } = req.query;
  if (!messageId) {
    return next(new ErrorHandler("Message id is not provided", 400));
  }

  if (chatId) {
    pusher.trigger(chatId, EVENTS.MESSAGE_VIEWED, {
      chatId,
      viewerId,
      messageId,
    });
  }

  await Message.findByIdAndUpdate(messageId, {
    $addToSet: {
      viewers: viewerId,
    },
  });

  res.status(200).json({ message: "Viewers list updated successfully" });
});

export const addReaction = catchAsyncError<
  { messageId: string },
  unknown,
  { reaction: string },
  { chatId: string }
>(async (req, res, next) => {
  const { messageId } = req.params;
  const { reaction } = req.body;
  const { chatId } = req.query;

  if (!reaction || !validReactions.includes(reaction)) {
    return next(new ErrorHandler("Invalid reaction", 400));
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return next(
      new ErrorHandler("Message already deleted or does not exist", 400)
    );
  }

  const chat = await Chat.findById(message.chat?.toString());
  if (!chat?.users?.includes(req.user._id.toString())) {
    return next(new ErrorHandler("You are not part of this message"));
  }

  const previouslyReacted = message?.reactions.find(
    (reaction) => reaction.user?.toString() === req.user._id.toString()
  );

  if (previouslyReacted) {
    message.reactions = message.reactions.map((reaction) => {
      if (reaction.user?.toString() !== req.user._id.toString()) {
        return reaction;
      }
      return {
        ...reaction,
        value: req.body.reaction,
      };
    });
  } else {
    message.reactions.push({
      user: req.user._id.toString(),
      value: req.body.reaction,
    });
  }

  await message.save();
  if (chatId) {
    pusher.trigger(chatId, EVENTS.REACTION_ADDED, {
      chatId,
      messageId,
      reaction: {
        userId: req.user._id.toString(),
        value: req.body.reaction,
      },
    });
  }

  res.status(200).json({ message: "Reaction updated successfully" });
});

export const removeReaction = catchAsyncError<
  { messageId: string },
  unknown,
  unknown,
  { chatId: string }
>(async (req, res, next) => {
  const messageId = req.params.messageId;
  const message = await Message.findById(messageId);
  const { chatId } = req.query;
  if (!message) {
    return next(new ErrorHandler("Message is deleted or does not exist", 400));
  }

  message.reactions = message?.reactions.filter(
    (reaction) => reaction.user?.toString() !== req.user._id.toString()
  );

  await message.save();
  if (chatId) {
    pusher.trigger(chatId, EVENTS.REACTION_REMOVED, {
      chatId,
      messageId,
      userId: req.user._id.toString(),
    });
  }

  res.status(200).json({ message: "Reaction removed successfully" });
});
