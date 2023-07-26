"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Name is mandatory field"],
        trim: true,
        minLength: [1, "Name must be at least 1 characters"],
        maxLength: [30, "Name should not exceed 30 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is mandatory field"],
        maxLength: [50, "Email should not exceed 50 characters"],
        validate: {
            validator: validator_1.default.isEmail,
            message: "Must provide valid email",
        },
    },
    password: {
        type: String,
        required: [true, "Password is mandatory field"],
        select: false,
        minLength: [6, "Password must be at least 6 characters"],
        maxLength: [12, "Password should not exceed 12 characters"],
    },
    googleUser: {
        type: Boolean,
        default: false,
    },
    picture: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcryptjs_1.default.hash(this.password || "", 10);
    }
    next();
});
userSchema.methods.comparePassword = async function (password) {
    const isMatch = await bcryptjs_1.default.compare(password, this.password);
    return isMatch;
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
