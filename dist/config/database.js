"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const devConsole_1 = __importDefault(require("../lib/devConsole"));
global.databaseConnected = false;
const connectDatabase = async () => {
    try {
        const { connection } = await mongoose_1.default.connect(process.env.MONGO_URI);
        global.databaseConnected = true;
        (0, devConsole_1.default)(`Mongodb connected at ${connection.host}`.magenta);
    }
    catch (error) {
        global.databaseConnected = true;
        if (error instanceof Error)
            (0, devConsole_1.default)(error.message);
        (0, devConsole_1.default)(`Error occured while connecting mongodb`.red);
    }
};
exports.connectDatabase = connectDatabase;
