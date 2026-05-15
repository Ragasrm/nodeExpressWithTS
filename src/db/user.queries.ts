import { Types } from "mongoose";
import { User } from "../models/User.model.js";

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
