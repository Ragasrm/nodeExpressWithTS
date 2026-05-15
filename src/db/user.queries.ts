import { Types } from "mongoose";
import type { UserAttrs } from "@src/models/User.model.js";
import { User } from "@src/models/User.model.js";

export type UserLean = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
};


const DEFAULT_LIST_LIMIT = 100;

export async function queryUsers(limit = DEFAULT_LIST_LIMIT): Promise<UserLean[]> {
  const capped = Math.min(Math.max(limit, 1), 500);
  return User.find().sort({ createdAt: -1 }).limit(capped).lean<UserLean[]>().exec();
}

export async function insertUser(attrs: UserAttrs): Promise<UserLean> {
  const created = await User.create(attrs);
  const lean = await User.findById(created._id).lean<UserLean>().exec();
  if (!lean) {
    throw new Error("Failed to read user after insert");
  }
  return lean;
}
