"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const devConsole_1 = __importDefault(require("./devConsole"));
const envSchema = zod_1.z.object({
    MONGO_URI: zod_1.z.string().min(5),
});
global.envLoaded = false;
function validateEnv() {
    if (process.env.NODE_ENV !== "production") {
        dotenv_1.default.config({
            path: ".env",
        });
    }
    try {
        envSchema.parse(process.env);
        envLoaded = true;
    }
    catch (error) {
        envLoaded = false;
        (0, devConsole_1.default)("MONGO_URI is not loaded on environment".red);
    }
}
exports.default = validateEnv;
