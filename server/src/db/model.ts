import mongoose, { Schema } from "mongoose";
import { User } from "../types/types";

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

export const UserModel = mongoose.model<User>('User', userSchema);
