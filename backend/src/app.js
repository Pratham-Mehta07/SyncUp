import express from "express";
import { createServer } from "node:http";
import "dotenv/config";

import { Server } from "socket.io";

import mongoose from "mongoose";
import cors from "cors";
import { connect } from "node:http2";
import connectToSocket from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/user", userRoutes);

const start = async () => {
  if (!process.env.DB_URL) {
    console.error("Environment variable DB_URL is not set. Set it in .env");
    process.exit(1);
  }
  try {
    const connectionDb = await mongoose.connect(process.env.DB_URL);
    server.listen(app.get("port"), () => {
      console.log("Listening on " + app.get("port"));
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message || err);
    process.exit(1);
  }
};

app.listen(8000, "0.0.0.0", () => {
  console.log("Server running...");
});

start();
