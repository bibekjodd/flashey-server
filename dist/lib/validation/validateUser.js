"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginUser = exports.validateRegisterUser = void 0;
const errorHandler_1 = require("../errorHandler");
const messages_1 = require("../messages");
const userValidationSchema_1 = require("./userValidationSchema");
const validateRegisterUser = (user) => {
    try {
        userValidationSchema_1.registerUserSchema.parse(user);
    }
    catch (error) {
        throw new errorHandler_1.ErrorHandler(messages_1.messages.form_fields_required, 400);
    }
};
exports.validateRegisterUser = validateRegisterUser;
const validateLoginUser = (user) => {
    try {
        userValidationSchema_1.loginUserSchema.parse(user);
    }
    catch (error) {
        throw new errorHandler_1.ErrorHandler(messages_1.messages.form_fields_required, 400);
    }
};
exports.validateLoginUser = validateLoginUser;
