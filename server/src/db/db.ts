import mongoose from "mongoose";
import { connectionString } from "../lib/config";


export const connectDB = async () => {
  try {
    await mongoose.connect(connectionString);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
