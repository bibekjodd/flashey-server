import mongoose from "mongoose";
import { validReactions } from "../lib/constants";

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        value: {
          type: String,
          enum: validReactions,
        },
      },
    ],

    image: {
      public_id: String,
      url: String,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true }
);

interface IMessage
  extends mongoose.InferSchemaType<typeof messageSchema>,
    mongoose.Document {}

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
