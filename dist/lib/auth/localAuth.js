"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLocalAuth = void 0;
// @ts-ignore
const passport_local_1 = require("passport-local");
// @ts-ignore
const passport_1 = __importDefault(require("passport"));
const User_Model_1 = __importDefault(require("../../models/User.Model"));
const initializeLocalAuth = () => {
    passport_1.default.use(new passport_local_1.Strategy({ passwordField: "password", usernameField: "email" }, 
    // @ts-ignore
    async (username, password, done) => {
        const user = await User_Model_1.default.findOne({ email: username }).select("+password");
        if (!user)
            return done(null, false);
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return done(null, false);
        done(null, user);
    }));
    // @ts-ignore
    passport_1.default.serializeUser(function (user, done) {
        // @ts-ignore
        done(null, user.id);
    });
    // @ts-ignore
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await User_Model_1.default.findById(id);
            done(null, user);
        }
        catch (error) {
            done(error, false);
        }
    });
};
exports.initializeLocalAuth = initializeLocalAuth;
