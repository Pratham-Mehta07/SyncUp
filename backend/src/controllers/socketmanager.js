import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
// Map of socket.id -> username
let usernames = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Emit early notification as soon as the socket starts disconnecting
    socket.on("disconnecting", () => {
      try {
        // Identify all rooms this socket is in and notify peers
        for (const [roomKey, roomUsers] of Object.entries(connections)) {
          if (roomUsers.includes(socket.id)) {
            roomUsers.forEach((socketId) => {
              if (socketId !== socket.id) {
                io.to(socketId).emit("user-left", socket.id);
              }
            });
          }
        }
      } catch (e) {
        console.error("Error during disconnecting for", socket.id, e);
      }
    });

    console.log("=== NEW SOCKET CONNECTION ===");
    console.log("Socket ID:", socket.id);

    // Add this to test if events are being registered
    socket.onAny((eventName, ...args) => {
      console.log(`=== RECEIVED EVENT: ${eventName} ===`);
      console.log("Args:", args);
    });

    console.log("Socket connected:", socket.id);

    socket.on("join-call", (path, username) => {
      console.log("User joined call:", socket.id, "Room:", path);

      // Initialize room if it doesn't exist
      if (connections[path] === undefined) {
        connections[path] = [];
      }

      // Add user to room
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();
      if (typeof username === "string" && username.trim().length > 0) {
        usernames[socket.id] = username.trim();
      } else {
        usernames[socket.id] = `User-${socket.id.substring(0, 5)}`;
      }

      console.log("Room", path, "now has users:", connections[path]);

      // Build usernames map for this room only
      const roomUsernames = {};
      connections[path].forEach((sid) => {
        roomUsernames[sid] = usernames[sid] || `User-${sid.substring(0, 5)}`;
      });

      // Notify all users in the room about the new user, include usernames map
      connections[path].forEach((socketId) => {
        io.to(socketId).emit("user-joined", socket.id, connections[path], roomUsernames);
      });

      // Send existing chat messages to the new user
      if (messages[path] !== undefined && messages[path].length > 0) {
        console.log(
          "Sending",
          messages[path].length,
          "existing messages to",
          socket.id
        );
        messages[path].forEach((message) => {
          io.to(socket.id).emit(
            "chat-message",
            message.data,
            message.sender,
            message["socket-id-sender"]
          );
        });
      }
    });

    // Fixed signal handler - properly forward WebRTC signaling
    socket.on("signal", (toId, message) => {
      console.log("Forwarding signal from", socket.id, "to", toId);
      io.to(toId).emit("signal", socket.id, message);
    });

    // Chat message handler - with more debugging
    socket.on("chat-message", (data, sender) => {
      console.log("=== CHAT MESSAGE EVENT RECEIVED ===");
      console.log("Data:", data);
      console.log("Sender:", sender);
      console.log("Socket ID:", socket.id);
      console.log(
        "Chat message received from",
        sender,
        "(",
        socket.id,
        "):",
        data
      );

      // Find which room this socket belongs to
      let matchingRoom = null;

      for (const [roomKey, roomUsers] of Object.entries(connections)) {
        if (roomUsers.includes(socket.id)) {
          matchingRoom = roomKey;
          break;
        }
      }

      if (matchingRoom) {
        console.log("Broadcasting message to room:", matchingRoom);

        // Initialize messages array for room if needed
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        // Store the message
        const messageObj = {
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
          timestamp: new Date(),
        };

        messages[matchingRoom].push(messageObj);

        console.log(
          "Message stored. Total messages in room:",
          messages[matchingRoom].length
        );

        // Broadcast to all users in the room
        connections[matchingRoom].forEach((socketId) => {
          console.log("Sending message to:", socketId);
          io.to(socketId).emit("chat-message", data, sender, socket.id);
        });

        console.log("Message broadcast complete");
      } else {
        console.error("No room found for socket:", socket.id);
        console.log("Current connections:", connections);
      }
    });

    // Fixed disconnect handler
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      if (timeOnline[socket.id]) {
        const sessionDuration = new Date() - timeOnline[socket.id];
        console.log("Session duration:", sessionDuration, "ms");
      }

      // Find and remove user from rooms
      for (const [roomKey, roomUsers] of Object.entries(connections)) {
        const userIndex = roomUsers.indexOf(socket.id);

        if (userIndex !== -1) {
          console.log("Removing user from room:", roomKey);

          // Notify other users in the room that this user left
          roomUsers.forEach((socketId) => {
            if (socketId !== socket.id) {
              io.to(socketId).emit("user-left", socket.id);
            }
          });

          // Remove user from room
          connections[roomKey].splice(userIndex, 1);

          // Clean up empty rooms
          if (connections[roomKey].length === 0) {
            console.log("Room", roomKey, "is now empty, cleaning up");
            delete connections[roomKey];
            delete messages[roomKey];
          }

          break; // User should only be in one room
        }
      }

      // Clean up user data
      delete timeOnline[socket.id];
      delete usernames[socket.id];
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error for", socket.id, ":", error);
    });
  });

  // Server-level error handling
  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  return io;
};

export default connectToSocket;
