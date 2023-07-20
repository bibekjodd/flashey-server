import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "message",
  },
  isGroupChat: { type: Boolean, default: false },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});

interface IChat
  extends mongoose.InferSchemaType<typeof chatSchema>,
    mongoose.Document {}

const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat;
