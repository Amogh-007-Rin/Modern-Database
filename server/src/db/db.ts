import mongoose from "mongoose";
import { config } from "../lib/config";


export const connectDB = async () => {
  try {
    await mongoose.connect(config.connectionString);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
