import { catchAsyncError } from "../middlewares/catchAsyncError";
import User from "../models/user.model";
import { ErrorHandler } from "../lib/errorHandler";
import {
  LoginUserSchema,
  RegisterUserSchema,
} from "../lib/zod/userValidationSchema";
import {
  validateLoginUser,
  validateRegisterUser,
} from "../lib/zod/validateUser";
import { messages } from "../lib/messages";
import { uploadProfilePicture } from "../lib/cloudinary";

export const createUser = catchAsyncError<unknown, unknown, RegisterUserSchema>(
  async (req, res, next) => {
    validateRegisterUser(req.body);
    const { name, email, password, imageUri } = req.body;

    const user = await User.findOne({ email });
    if (user) return next(new ErrorHandler(messages.email_already_taken, 409));

    const { public_id, url } = await uploadProfilePicture(imageUri);

    const newUser = await User.create({
      name,
      email,
      password,
      picture: { public_id, url },
    });
    res.status(201).json({
      user: newUser,
    });
  }
);

export const login = catchAsyncError<unknown, unknown, LoginUserSchema>(
  async (req, res, next) => {
    validateLoginUser(req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler(messages.invalid_creditials, 404));

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return next(new ErrorHandler(messages.invalid_creditials, 400));

    res.status(200).json({ user });
  }
);

export const myProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    user,
  });
});
