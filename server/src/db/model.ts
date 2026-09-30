import mongoose, { Schema, Document } from "mongoose";
import { userSchema } from "../types/types";



const userSchema = new Schema<userSchema>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

export const UserModel = mongoose.model<userSchema>('User', userSchema);
