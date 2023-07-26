import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isGroupChat: { type: Boolean, default: false },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    image: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true }
);

interface IChat
  extends mongoose.InferSchemaType<typeof chatSchema>,
    mongoose.Document {}

const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat;
