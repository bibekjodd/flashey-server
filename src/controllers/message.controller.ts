import { uploadMessagePicture } from "../lib/cloudinary";
import { ErrorHandler } from "../lib/errorHandler";
import { messages } from "../lib/messages";
import { catchAsyncError } from "../middlewares/catchAsyncError";
import Chat from "../models/Chat.Model";
import Message from "../models/Message.Model";

export const sendMessage = catchAsyncError<
  { chatId: string },
  unknown,
  { text?: string; image?: string }
>(async (req, res, next) => {
  const { chatId } = req.params;
  const { text, image } = req.body;

  if (!text && !image) {
    return next(new ErrorHandler("Message must contain text or image", 400));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler("Chat doesn't exist", 400));
  }

  if (!chat.users.includes(req.user._id.toString())) {
    return next(new ErrorHandler("You do not belong to this chat", 400));
  }

  if (text) {
    const message = await Message.create({
      chat: chatId,
      text,
      sender: req.user._id.toString(),
      viewers: [req.user._id.toString()],
    });

    await Chat.findByIdAndUpdate(chat._id.toString(), {
      $set: {
        latestMessage: message._id.toString(),
      },
    });

    return res.status(200).json({ message: messages.send_message_success });
  }

  if (image) {
    const { public_id, url } = await uploadMessagePicture(image);
    if (!public_id && !url) {
      return next(new ErrorHandler("Image could not be delivered", 400));
    }

    await Message.create({
      chat: chatId,
      sender: req.user._id.toString(),
      image: { public_id, url },
    });

    return res.status(200).json({ message: messages.send_message_success });
  }

  res.status(400).json({ message: messages.unexpected_error });
});


