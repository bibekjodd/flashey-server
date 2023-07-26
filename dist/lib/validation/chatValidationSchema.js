"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupChatSchema = void 0;
const zod_1 = require("zod");
exports.createGroupChatSchema = zod_1.z.object({
    groupName: zod_1.z.string().min(4),
    users: zod_1.z.array(zod_1.z.string()).min(1),
    image: zod_1.z.string().optional(),
});
