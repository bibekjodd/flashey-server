"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateGroupChat = void 0;
const chatValidationSchema_1 = require("./chatValidationSchema");
const errorHandler_1 = require("../errorHandler");
const validateCreateGroupChat = (data) => {
    try {
        chatValidationSchema_1.createGroupChatSchema.parse(data);
    }
    catch (error) {
        throw new errorHandler_1.ErrorHandler("Make sure the group name is specified and at least 2 users are required to form a group chat", 400);
    }
};
exports.validateCreateGroupChat = validateCreateGroupChat;
