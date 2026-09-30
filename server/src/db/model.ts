import mongoose, { Schema, Document } from "mongoose";

export interface User {
  name: string;
  email: string;
}

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

export const UserModel = mongoose.model<User>('User', userSchema);
