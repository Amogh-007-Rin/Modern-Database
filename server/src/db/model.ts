import mongoose, { Schema } from "mongoose";
import { OAuthAccount, User } from "../types/types";

const oauthAccountSchema = new Schema<OAuthAccount>(
  {
    provider: {
      type: String,
      enum: ["google", "github", "discord"],
      required: true,
    },
    providerAccountId: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<User>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, select: false },
  avatarUrl: { type: String },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  providers: { type: [oauthAccountSchema], default: [] },
}, { timestamps: true });

userSchema.index(
  { "providers.provider": 1, "providers.providerAccountId": 1 },
  { unique: true, sparse: true },
);

export const UserModel = mongoose.model<User>("User", userSchema);
