"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameGroup = exports.removeFromGroup = exports.addToGroup = exports.createGroupChat = exports.fetchChats = exports.accessChat = exports.accessFriendsChat = void 0;
const errorHandler_1 = require("../lib/errorHandler");
const messages_1 = require("../lib/messages");
const validateChat_1 = require("../lib/validation/validateChat");
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const Chat_Model_1 = __importDefault(require("../models/Chat.Model"));
const Message_Model_1 = __importDefault(require("../models/Message.Model"));
const User_Model_1 = __importDefault(require("../models/User.Model"));
exports.accessFriendsChat = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const friendsId = req.params?.friendsId;
    const friend = await User_Model_1.default.findById(friendsId);
    if (!friend) {
        return next(new errorHandler_1.ErrorHandler("User is not available", 400));
    }
    if (req.user._id.toString() === friendsId) {
        return next(new errorHandler_1.ErrorHandler("You can't chat with yourself", 400));
    }
    const chat = await Chat_Model_1.default.findOne({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: friendsId } } },
            { users: { $elemMatch: { $eq: req.user._id.toString() } } },
        ],
    }).populate("users", "name picture email");
    if (chat) {
        const messages = await Message_Model_1.default.find({
            chat: chat._id.toString(),
        })
            .populate({ path: "sender", select: "name picture email" })
            .populate({ path: "viewers", select: "name picture email" })
            .populate({
            path: "reactions",
            populate: {
                path: "user",
                select: "name picture email",
            },
        })
            .sort({ updatedAt: "desc" });
        return res.status(200).json({
            chat,
            messages,
        });
    }
    const newChat = await (await Chat_Model_1.default.create({
        isGroupChat: false,
        users: [req.user._id, friendsId],
    })).populate("users", "name picture email");
    res.status(200).json({ chat: newChat, messages: [] });
});
exports.accessChat = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const { chatId } = req.params;
    const chat = await Chat_Model_1.default.findById(chatId)
        .populate({ path: "users", select: "name picture email" })
        .populate({ path: "latestMessage" })
        .populate({ path: "groupAdmin" });
    if (!chat) {
        return next(new errorHandler_1.ErrorHandler("Chat doesn't exist", 400));
    }
    const messages = await Message_Model_1.default.find({
        chat: chat._id.toString(),
    })
        .populate({ path: "sender", select: "name picture email" })
        .populate({ path: "viewers", select: "name picture email" })
        .populate({
        path: "reactions",
        populate: {
            path: "user",
            select: "name picture email",
        },
    })
        .sort({ updatedAt: "desc" });
    return res.status(200).json({ chat, messages });
});
exports.fetchChats = (0, catchAsyncError_1.catchAsyncError)(async (req, res) => {
    let chats = await Chat_Model_1.default.find({
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
        .sort({ updatedAt: "desc" });
    chats = JSON.parse(JSON.stringify(chats));
    const fullChat = [];
    for (let i = 0; i < chats.length; i++) {
        const messages = await Message_Model_1.default.find({ chat: chats[i]._id.toString() })
            .populate({
            path: "reactions",
            populate: {
                path: "user",
                select: "name picture email",
            },
        })
            .populate({ path: "sender", select: "name picture email" })
            .populate({ path: "viewers", select: "name picture email" }).sort({ updatedAt: 'desc' });
        const parsedMessages = JSON.parse(JSON.stringify(messages));
        fullChat.push({
            ...JSON.parse(JSON.stringify(chats[i])),
            messages: parsedMessages,
        });
    }
    res.status(200).json({ chats: fullChat });
});
exports.createGroupChat = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    (0, validateChat_1.validateCreateGroupChat)(req.body);
    const { users, groupName } = req.body;
    if (!users.includes(req.user._id.toString())) {
        users.push(req.user._id.toString());
    }
    if (users.length < 2) {
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.insufficient_users_in_group, 400));
    }
    const chat = await Chat_Model_1.default.create({
        users,
        name: groupName,
        isGroupChat: true,
        groupAdmin: req.user._id,
    });
    const fullChat = await Chat_Model_1.default.findById(chat.id)
        .populate({ path: "users", select: "name picture email" })
        .populate({ path: "latestMessage", select: "name picture email" })
        .populate({ path: "groupAdmin", select: "name picture email" });
    res.status(200).json({ chat: fullChat });
});
exports.addToGroup = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const { chatId, userId } = req.query;
    if (!chatId || !userId)
        return next(new errorHandler_1.ErrorHandler("Please provide chat id and user id to perform this action", 400));
    const chat = await Chat_Model_1.default.findById(chatId);
    if (!chat || !chat?.isGroupChat) {
        return next(new errorHandler_1.ErrorHandler("Chat doesn't exist", 400));
    }
    if (chat.groupAdmin?.toString() !== req.user._id.toString()) {
        return next(new errorHandler_1.ErrorHandler("You must be group admin to perform this action", 400));
    }
    // @ts-ignore
    if (!chat.users.includes(userId)) {
        // @ts-ignore
        chat.users.push(userId);
    }
    await chat.save();
    res.status(200).json({ message: messages_1.messages.group_user_add_success });
});
exports.removeFromGroup = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const { chatId, userId } = req.query;
    if (!chatId || !userId) {
        return next(new errorHandler_1.ErrorHandler("Please provide chat id an user id to perform this action", 400));
    }
    const group = await Chat_Model_1.default.updateOne({ _id: chatId, groupAdmin: req.user._id.toString() }, {
        $pull: {
            users: userId,
        },
    });
    if (group.matchedCount === 0)
        return next(new errorHandler_1.ErrorHandler("Group doesn't exist", 400));
    res.status(200).json({ message: messages_1.messages.group_user_remove_success });
});
exports.renameGroup = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    const { groupId, newGroupName } = req.query;
    const group = await Chat_Model_1.default.updateOne({ _id: groupId, groupAdmin: req.user._id.toString() }, {
        name: newGroupName,
    });
    if (group.matchedCount === 0) {
        return next(new errorHandler_1.ErrorHandler("Group doesn't exist or you don't have sufficient pemissions to perform this action", 400));
    }
    res.status(200).json({ message: "Group renamed successfully" });
});
