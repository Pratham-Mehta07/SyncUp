import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import connectToSocket from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

/* Create HTTP server */
const server = createServer(app);

/* Attach Socket.IO */
connectToSocket(server);

/* Middleware */
const allowedOrigins = [
  "https://syncup-wi6l.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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
