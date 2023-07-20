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

export const createUser = catchAsyncError<unknown, unknown, RegisterUserSchema>(
  async (req, res, next) => {
    validateRegisterUser(req.body);
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user)
      return next(new ErrorHandler("User with same email already exists", 409));
    const newUser = await User.create({ name, email, password });
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
    if (!user) return next(new ErrorHandler("Invalid user credintials", 404));

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return next(new ErrorHandler("Invalid user credintials", 400));

    res.status(200).json({ user });
  }
);

// use middleware before this
export const myProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    user,
  });
});
