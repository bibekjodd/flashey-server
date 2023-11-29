import { catchAsyncError } from '@/middlewares/catch-async-error';
import User from '@/models/user.model';
import { CustomError } from '@/lib/custom-error';
import type {
  LoginUserSchema,
  RegisterUserSchema
} from '@/lib/validation/user-validation-schema';
import {
  validateLoginUser,
  validateRegisterUser
} from '@/lib/validation/validate-users';
import { messages } from '@/lib/messages';
import { uploadProfilePicture } from '@/lib/cloudinary';
import { cookieOptions, sendToken } from '@/lib/sendToken';

export const createUser = catchAsyncError<unknown, unknown, RegisterUserSchema>(
  async (req, res, next) => {
    validateRegisterUser(req.body);
    const { name, email, password, imageUri } = req.body;

    const user = await User.findOne({ email });
    if (user) return next(new CustomError(messages.email_already_taken, 400));

    const { public_id, url } = await uploadProfilePicture(imageUri);

    const newUser = await User.create({
      name,
      email,
      password,
      picture: { public_id, url }
    });

    sendToken(res, newUser, 201);
  }
);

export const login = catchAsyncError<unknown, unknown, LoginUserSchema>(
  async (req, res, next) => {
    validateLoginUser(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new CustomError(messages.invalid_creditials, 400));
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches)
      return next(new CustomError(messages.invalid_creditials, 400));

    sendToken(res, user, 200);
  }
);

export const myProfile = catchAsyncError(async (req, res) => {
  const user = await User.findById({ _id: req.user._id.toString() });
  res.status(200).json({
    user
  });
});

export const logout = catchAsyncError(async (req, res) => {
  res
    .cookie('token', null, cookieOptions)
    .status(200)
    .json({ message: messages.logout_succcess });
});

export const searchUsers = catchAsyncError<
  unknown,
  unknown,
  unknown,
  { search?: string }
>(async (req, res) => {
  const search = req.query.search || '';

  let users = await User.find({
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  });

  users = users.filter((user) => user.email !== req.user.email);

  res.status(200).json({ users });
});

export const suggestedUsers = catchAsyncError(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id.toString() }
  }).limit(10);
  res.status(200).json({ users });
});
