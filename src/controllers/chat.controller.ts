import { uploadProfilePicture } from "../lib/cloudinary";
import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { CreateGroupChatSchema } from "../lib/validation/chatValidationSchema";
import { validateCreateGroupChat } from "../lib/validation/validateChat";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import Chat from "../models/Chat.Model";
import Message from "../models/Message.Model";
import User from "../models/User.Model";

export const accessFriendsChat = catchAsyncError<{ friendsId?: string }>(
  async (req, res, next) => {
    const friendsId = req.params?.friendsId;

    const friend = await User.findById(friendsId);
    if (!friend) {
      return next(new ErrorHandler("User is not available", 400));
    }

    if (req.user._id.toString() === friendsId) {
      return next(new ErrorHandler("You can't chat with yourself", 400));
    }

    const chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: friendsId } } },
        { users: { $elemMatch: { $eq: req.user._id.toString() } } },
      ],
    }).populate("users", "name picture email");

    if (chat) {
      const messages = await Message.find({
        chat: chat._id.toString(),
      }).sort({ createdAt: "desc" });

      return res.status(200).json({
        chat: {
          ...JSON.parse(JSON.stringify(chat)),
          messages,
        },
      });
    }

    const newChat = await (
      await Chat.create({
        isGroupChat: false,
        users: [req.user._id, friendsId],
      })
    ).populate("users", "name picture email");

    res.status(200).json({ chat: newChat, messages: [] });
  }
);

export const accessChat = catchAsyncError<{ chatId: string }>(
  async (req, res, next) => {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate({ path: "users", select: "name picture email" })
      .populate({ path: "latestMessage" })
      .populate({ path: "groupAdmin" });

    if (!chat) {
      return next(new ErrorHandler("Chat doesn't exist", 400));
    }

    const messages = await Message.find({
      chat: chat._id.toString(),
    }).sort({ createdAt: "desc" });

    return res.status(200).json({
      chat: {
        ...JSON.parse(JSON.stringify(chat)),
        messages,
      },
    });
  }
);

export const fetchChats = catchAsyncError(async (req, res) => {
  let chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate({ path: "users", select: "name picture email" })
    .sort({ updatedAt: "desc" });

  chats = JSON.parse(JSON.stringify(chats));

  const fullChat = [] as any;
  for (let i = 0; i < chats.length; i++) {
    const messages = await Message.find({ chat: chats[i]._id.toString() });

    const parsedMessages = JSON.parse(JSON.stringify(messages));
    fullChat.push({
      ...JSON.parse(JSON.stringify(chats[i])),
      messages: parsedMessages,
    });
  }

  res.status(200).json({ chats: fullChat });
});

export const createGroupChat = catchAsyncError<
  unknown,
  unknown,
  CreateGroupChatSchema
>(async (req, res, next) => {
  validateCreateGroupChat(req.body);

  const { users, groupName, image } = req.body;
  users.push(req.user._id.toString());
  const includedUsers: string[] = [];
  const uniqueUsers = users.filter((user) => {
    if (includedUsers.includes(user)) return false;

    includedUsers.push(user);
    return true;
  });

  if (users.length < 2) {
    return next(new ErrorHandler(messages.insufficient_users_in_group, 400));
  }

  const chat = new Chat({
    users: uniqueUsers,
    name: groupName,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  if (image) {
    const { public_id, url } = await uploadProfilePicture(image);
    chat.image = {
      public_id,
      url,
    };
  }

  await chat.save();

  const fullChat = await Chat.findById(chat.id).populate({
    path: "users",
    select: "name picture email",
  });

  res.status(200).json({ chat: fullChat });
});

export const addToGroup = catchAsyncError<
  unknown,
  unknown,
  unknown,
  { chatId: string; userId: string }
>(async (req, res, next) => {
  const { chatId, userId } = req.query;
  if (!chatId || !userId)
    return next(
      new ErrorHandler(
        "Please provide chat id and user id to perform this action",
        400
      )
    );

  const chat = await Chat.findById(chatId);

  if (!chat || !chat?.isGroupChat) {
    return next(new ErrorHandler("Chat doesn't exist", 400));
  }

  if (chat.groupAdmin?.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You must be group admin to perform this action", 400)
    );
  }

  // @ts-ignore
  if (!chat.users.includes(userId)) {
    // @ts-ignore
    chat.users.push(userId);
  }

  await chat.save();

  res.status(200).json({ message: messages.group_user_add_success });
});

export const removeFromGroup = catchAsyncError<
  unknown,
  unknown,
  unknown,
  { chatId: string; userId: string }
>(async (req, res, next) => {
  const { chatId, userId } = req.query;

  if (!chatId || !userId) {
    return next(
      new ErrorHandler(
        "Please provide chat id an user id to perform this action",
        400
      )
    );
  }

  const group = await Chat.updateOne(
    { _id: chatId, groupAdmin: req.user._id.toString() },
    {
      $pull: {
        users: userId,
      },
    }
  );

  if (group.matchedCount === 0)
    return next(new ErrorHandler("Group doesn't exist", 400));

  res.status(200).json({ message: messages.group_user_remove_success });
});

export const renameGroup = catchAsyncError<
  unknown,
  unknown,
  unknown,
  { groupId: string; newGroupName: string }
>(async (req, res, next) => {
  const { groupId, newGroupName } = req.query;

  const group = await Chat.updateOne(
    { _id: groupId, groupAdmin: req.user._id.toString() },
    {
      name: newGroupName,
    }
  );

  if (group.matchedCount === 0) {
    return next(
      new ErrorHandler(
        "Group doesn't exist or you don't have sufficient pemissions to perform this action",
        400
      )
    );
  }

  res.status(200).json({ message: "Group renamed successfully" });
});
