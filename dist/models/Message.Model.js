"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../lib/constants");
const messageSchema = new mongoose_1.default.Schema({
    text: {
        type: String,
        trim: true,
    },
    reactions: [
        {
            user: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "User",
            },
            value: {
                type: String,
                enum: constants_1.validReactions,
            },
        },
    ],
    image: {
        public_id: String,
        url: String,
    },
    sender: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    viewers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    chat: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Chat" },
}, { timestamps: true });
const Message = mongoose_1.default.model("Message", messageSchema);
exports.default = Message;
