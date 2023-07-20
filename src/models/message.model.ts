import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    text: String,
    reactions: [
      {
        type: String,
        enum: ["haha", "love", "wow", "angry", "sad"],
      },
    ],

    image: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "chat" },
  },
  { timestamps: true }
);

interface IMessage
  extends mongoose.InferSchemaType<typeof messageSchema>,
    mongoose.Document {}

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
