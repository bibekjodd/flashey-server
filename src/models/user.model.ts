import mongoose, { InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is mandatory field"],
      trim: true,
      minLength: [1, "Name must be at least 1 characters"],
      maxLength: [30, "Name should not exceed 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is mandatory field"],
      maxLength: [50, "Email should not exceed 50 characters"],
      validate: {
        validator: validator.isEmail,
        message: "Must provide valid email",
      },
    },

    password: {
      type: String,
      required: [true, "Password is mandatory field"],
      select: false,
      minLength: [6, "Password must be at least 6 characters"],
      maxLength: [12, "Password should not exceed 12 characters"],
    },

    googleUser: {
      type: Boolean,
      default: false,
    },

    picture: {
      public_id: String,
      url: String,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password || "", 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

type UserMethods = {
  comparePassword: (password: string) => Promise<boolean>;
};

export interface IUser
  extends InferSchemaType<typeof userSchema>,
    UserMethods,
    mongoose.Document {}

const User = mongoose.model<IUser>("User", userSchema);
export default User;
