"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const messages_1 = require("../lib/messages");
const notFound = (req, res) => {
    res.status(404).json({
        message: messages_1.messages.not_found,
    });
};
exports.notFound = notFound;
