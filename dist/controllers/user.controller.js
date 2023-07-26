"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.logout = exports.myProfile = exports.createUser = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const User_Model_1 = __importDefault(require("../models/User.Model"));
const errorHandler_1 = require("../lib/errorHandler");
const validateUser_1 = require("../lib/validation/validateUser");
const messages_1 = require("../lib/messages");
const cloudinary_1 = require("../lib/cloudinary");
const sendToken_1 = require("../lib/sendToken");
exports.createUser = (0, catchAsyncError_1.catchAsyncError)(async (req, res, next) => {
    (0, validateUser_1.validateRegisterUser)(req.body);
    const { name, email, password, imageUri } = req.body;
    const user = await User_Model_1.default.findOne({ email });
    if (user)
        return next(new errorHandler_1.ErrorHandler(messages_1.messages.email_already_taken, 400));
    const { public_id, url } = await (0, cloudinary_1.uploadProfilePicture)(imageUri);
    const newUser = await User_Model_1.default.create({
        name,
        email,
        password,
        picture: { public_id, url },
    });
    (0, sendToken_1.sendToken)(res, newUser);
});
exports.myProfile = (0, catchAsyncError_1.catchAsyncError)(async (req, res) => {
    const user = await User_Model_1.default.findById({ _id: req.user._id.toString() });
    res.status(200).json({
        user,
    });
});
exports.logout = (0, catchAsyncError_1.catchAsyncError)(async (req, res) => {
    // @ts-ignore
    req.logOut((err) => {
        if (err) {
            return res
                .status(400)
                .json({ message: "Error occurred while signing out" });
        }
    });
    res.status(200).json({ message: messages_1.messages.logout_succcess });
});
exports.searchUsers = (0, catchAsyncError_1.catchAsyncError)(async (req, res) => {
    const search = req.query.search || "";
    let users = await User_Model_1.default.find({
        $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ],
    });
    users = users.filter((user) => user.email !== req.user.email);
    res.status(200).json({ users });
});
