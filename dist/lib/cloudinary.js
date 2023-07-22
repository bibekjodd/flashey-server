"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMessagePicture = exports.uploadProfilePicture = exports.configureCloudinary = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const configureCloudinary = () => {
    cloudinary_1.default.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
};
exports.configureCloudinary = configureCloudinary;
const uploadProfilePicture = async (datauri) => {
    if (!datauri)
        return {};
    try {
        const { public_id, secure_url } = await cloudinary_1.default.v2.uploader.upload(datauri, { folder: "RealtimeChatApi/profilepicture" });
        return { public_id, url: secure_url };
    }
    catch (err) {
        return {};
    }
};
exports.uploadProfilePicture = uploadProfilePicture;
const uploadMessagePicture = async (datauri) => {
    if (!datauri)
        return {};
    try {
        const { public_id, secure_url } = await cloudinary_1.default.v2.uploader.upload(datauri, { folder: "RealtimeChatApi/chatmessages" });
        return { public_id, url: secure_url };
    }
    catch (err) {
        return {};
    }
};
exports.uploadMessagePicture = uploadMessagePicture;
