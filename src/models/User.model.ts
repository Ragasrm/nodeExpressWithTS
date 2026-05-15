import mongoose, { Schema } from "mongoose";

export interface UserAttrs {
  name: string;
  email: string;
}

const userSchema = new Schema<UserAttrs>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserAttrs>("User", userSchema);
