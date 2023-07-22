import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { validateCreateGroupChat } from "../lib/validation/validateChat";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import Chat from "../models/Chat.Model";
import Message from "../models/Message.Model";

export const accessChat = catchAsyncError<{ friendsId?: string }>(
  async (req, res, next) => {
    const friendsId = req.params?.friendsId;

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
      const messages = await Message.find({ chat: chat._id.toString() });
      return res.status(200).json({
        chat,
        messages,
      });
    }

    const newChat = await (
      await Chat.create({
        isGroupChat: false,
        users: [req.user._id, friendsId],
      })
    ).populate("users", "name picture email");

    res.status(200).json({ chat: newChat });
  }
);

export const fetchChats = catchAsyncError(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate({ path: "users", select: "name picture email" })
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name picture email",
      },
    })
    .sort({ updatedAt: -1 });
  res.status(200).json({ chats });
});

export const createGroupChat = catchAsyncError<
  unknown,
  unknown,
  { groupName: string; users: string[] }
>(async (req, res, next) => {
  validateCreateGroupChat(req.body);

  const { users, groupName } = req.body;

  if (!users.includes(req.user._id.toString())) {
    users.push(req.user._id.toString());
  }

  if (users.length < 2) {
    return next(new ErrorHandler(messages.insufficient_users_in_group, 400));
  }

  const chat = await Chat.create({
    users,
    name: groupName,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullChat = await Chat.findById(chat.id)
    .populate({ path: "users", select: "name picture email" })
    .populate({ path: "latestMessage", select: "name picture email" })
    .populate({ path: "groupAdmin", select: "name picture email" });

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
