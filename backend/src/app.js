import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import connectToSocket from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

/* Create HTTP server */
const server = createServer(app);

/* Attach Socket.IO */
connectToSocket(server);

/* Middleware */
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

/* Routes */
app.use("/api/v1/user", userRoutes);

/* Port (Render-compatible) */
const PORT = process.env.PORT || 8000;

/* Start server */
const start = async () => {
  if (!process.env.DB_URL) {
    console.error("DB_URL is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
};

start();
