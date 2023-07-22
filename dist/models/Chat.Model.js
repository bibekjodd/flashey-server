"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chatSchema = new mongoose_1.default.Schema({
    name: { type: String, trim: true },
    users: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Message",
    },
    isGroupChat: { type: Boolean, default: false },
    groupAdmin: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const Chat = mongoose_1.default.model("Chat", chatSchema);
exports.default = Chat;
