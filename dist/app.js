"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("colors");
const error_1 = require("./middlewares/error");
const notFound_1 = require("./middlewares/notFound");
const user_route_1 = __importDefault(require("./routes/user.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const message_route_1 = __importDefault(require("./routes/message.route"));
const devConsole_1 = __importDefault(require("./lib/devConsole"));
const appConfig_1 = __importDefault(require("./config/appConfig"));
// -------- app initialization --------
const app = (0, express_1.default)();
(0, appConfig_1.default)(app);
// -------- routes --------
app.use("/api/v1", user_route_1.default);
app.use("/api/v1", chat_route_1.default);
app.use("/api/v1", message_route_1.default);
app.use(notFound_1.notFound);
app.use(error_1.error);
app.listen(process.env.PORT || 5000, () => {
    (0, devConsole_1.default)(`Server listening at http://localhost:${process.env.PORT || 5000}`.yellow);
});
