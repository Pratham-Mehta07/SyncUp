import express from "express";
import { createServer } from "node:http";

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
  const connectionDb = await mongoose.connect(
    "mongodb+srv://mehtapratham2005:Mehta1207@cluster0.7m187gd.mongodb.net/"
  );
  console.log("MONGO Connected DB Host" + connectionDb.connection.host);
  server.listen(app.get("port"), () => {
    console.log("Listening on 8000");
  });
};

app.listen(8000, "0.0.0.0", () => {
  console.log("Server running...");
});

start();
