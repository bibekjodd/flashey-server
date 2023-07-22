"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validateEnv_1 = __importDefault(require("../lib/validateEnv"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../lib/cloudinary");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
/**
 * Initial config for app
 *
 * Checks `process.env`
 *
 * Connects database & adds some required middleware
 */
function initialConfig(app) {
    (0, validateEnv_1.default)();
    (0, database_1.connectDatabase)();
    (0, cloudinary_1.configureCloudinary)();
    // app configs
    app.use(express_1.default.json({ limit: "2mb" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL.split(" "), credentials: true }));
    app.enable("trust proxy");
    app.use((0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
        if (mongoose_1.default.ConnectionStates.disconnected ||
            mongoose_1.default.ConnectionStates.uninitialized ||
            mongoose_1.default.connections.length < 1) {
            await (0, database_1.connectDatabase)();
        }
        next();
    }));
    app.get("/api/status", (req, res) => {
        res.json({
            databaseConnected,
            envLoaded,
            env: process.env.NODE_ENV,
            mongooseConnections: mongoose_1.default.connections.length,
        });
    });
    //
}
exports.default = initialConfig;
