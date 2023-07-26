"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGoogleAuth = void 0;
// @ts-ignore
const passport_1 = __importDefault(require("passport"));
// @ts-ignore
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_Model_1 = __importDefault(require("../../models/User.Model"));
const initializeGoogleAuth = () => {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
    }, 
    // @ts-ignore
    async (accessToken, refreshToken, profile, done) => {
        const name = profile.displayName;
        const email = profile.emails?.at(0)?.value || "";
        const pictureUrl = profile.photos?.at(0)?.value || "";
        try {
            const user = await User_Model_1.default.findOne({ email });
            if (user) {
                user.name = name;
                user.email = email;
                user.picture = { url: pictureUrl };
                await user.save();
                return done(null, user);
            }
            else {
                const user = await User_Model_1.default.create({
                    name,
                    email,
                    picture: {
                        url: pictureUrl,
                    },
                    password: process.env.SESSION_SECRET.slice(0, 10),
                    googleUser: true,
                });
                return done(null, user);
            }
        }
        catch (err) {
            done(err, false);
        }
    }));
    // @ts-ignore
    passport_1.default.serializeUser((user, done) => {
        // @ts-ignore
        return done(null, user.id);
    });
    // @ts-ignore
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await User_Model_1.default.findById(id);
            return done(null, user);
        }
        catch (error) {
            return done(error, undefined);
        }
    });
};
exports.initializeGoogleAuth = initializeGoogleAuth;
