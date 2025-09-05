import { Schema } from "mongoose";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  password: String,
  token: String,
  verified: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

export { User };
