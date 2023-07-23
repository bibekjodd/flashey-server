"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validateEnv_1 = __importDefault(require("../lib/validateEnv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const database_1 = require("./database");
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../lib/cloudinary");
// import cookieParser from "cookie-parser";
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const googlAuth_1 = require("../lib/auth/googlAuth");
const localAuth_1 = require("../lib/auth/localAuth");
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
    app.use(express_1.default.json({ limit: "2mb" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, express_session_1.default)({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "development" ? false : true,
            httpOnly: process.env.NODE_ENV === "development" ? false : true,
            sameSite: process.env.NODE_ENV === "development" ? false : "none",
        },
    }));
    app.enable("trust proxy");
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL.split(" ") || [],
        credentials: true,
    }));
    app.use(passport_1.default.authenticate("session"));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    (0, localAuth_1.initializeLocalAuth)();
    (0, googlAuth_1.initializeGoogleAuth)();
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
