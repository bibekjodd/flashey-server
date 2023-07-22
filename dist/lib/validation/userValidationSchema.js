"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUserSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
exports.registerUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(4),
    email: zod_1.z.string().min(4),
    password: zod_1.z.string().min(4),
    imageUri: zod_1.z.string().optional(),
});
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z.string().min(4),
    password: zod_1.z.string().min(4),
});
