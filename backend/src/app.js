import express from "express";
import { createServer } from "node:http";
import "dotenv/config";

import { Server } from "socket.io";

import mongoose from "mongoose";
import cors from "cors";
import { connect } from "node:http2";
import connectToSocket from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";
const PORT = process.env.PORT || 8000;

const start = async () => {
  if (!process.env.DB_URL) {
    console.error("Environment variable DB_URL is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
};

start();
