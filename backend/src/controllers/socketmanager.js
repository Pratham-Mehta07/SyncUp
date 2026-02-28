import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
// Map of socket.id -> username
let usernames = {};
// Map of roomKey -> Host socket.id
let roomHosts = {};
// Map of roomKey -> Array of waiting user data { socketId, username }
let waitingRoom = {};

// Helper function to build and send the participants list
const broadcastParticipantsList = (roomKey, io) => {
  const roomUsers = connections[roomKey];
  if (roomUsers) {
    const payload = roomUsers.map((sid) => ({
      socketId: sid,
      username: usernames[sid] || `User-${sid.substring(0, 5)}`,
      role: roomHosts[roomKey] === sid ? "Host" : "Member"
    }));
    
    // Send to all users in the room
    roomUsers.forEach((sid) => {
      io.to(sid).emit("participants-update", payload);
    });
  }
};

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
            // If the host is leaving, end the meeting
            if (roomHosts[roomKey] === socket.id) {
              roomUsers.forEach((socketId) => {
                if (socketId !== socket.id) {
                  io.to(socketId).emit("meeting-ended");
                }
              });
              const waitingUsers = waitingRoom[roomKey] || [];
              waitingUsers.forEach((user) => {
                io.to(user.socketId).emit("meeting-ended");
              });
            } else {
              // Otherwise just notify the user left
              roomUsers.forEach((socketId) => {
                if (socketId !== socket.id) {
                  io.to(socketId).emit("user-left", socket.id);
                }
              });
            }
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

      // Initialize room Host if it doesn't exist (i.e., first user joining)
      if (connections[path] === undefined) {
        connections[path] = [];
        roomHosts[path] = socket.id;
      }

      const assignedUsername =
        typeof username === "string" && username.trim().length > 0
          ? username.trim()
          : `User-${socket.id.substring(0, 5)}`;

      usernames[socket.id] = assignedUsername;

      // Check if user is the Host
      if (roomHosts[path] === socket.id) {
        // Add Host directly to the room
        connections[path].push(socket.id);
        timeOnline[socket.id] = new Date();
        socket.emit("role", "Host");

        console.log("Host joined Room", path, "now has users:", connections[path]);
      } else {
        // Handle members (Guests)
        // Check if waiting room exists for this path
        if (waitingRoom[path] === undefined) {
          waitingRoom[path] = [];
        }

        // Add to waiting room
        waitingRoom[path].push({
          socketId: socket.id,
          username: assignedUsername,
        });

        // Notify member they are waiting
        socket.emit("waiting-for-host");

        // Notify host that someone is waiting
        io.to(roomHosts[path]).emit("guest-waiting", {
          socketId: socket.id,
          username: assignedUsername,
        });

        console.log("Guest placed in waiting room", path, ":", assignedUsername);
        return; // Don't proceed to connect them yet
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

      // Broadcast updated participant list
      broadcastParticipantsList(path, io);

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

    // Event when Host admits or denies a given waiting guest
    socket.on("admit-guest", (path, guestSocketId, admitted) => {
      // Security check to ensure sender is the Host
      if (roomHosts[path] !== socket.id) {
        console.warn("Non-host attempted to admit a guest");
        return;
      }

      // Check if user is in waiting room
      const waitingUsers = waitingRoom[path] || [];
      const userIndex = waitingUsers.findIndex(
        (u) => u.socketId === guestSocketId
      );

      if (userIndex !== -1) {
        // Remove from waiting room
        waitingRoom[path].splice(userIndex, 1);

        if (admitted) {
          // Add guest to active connections
          connections[path].push(guestSocketId);
          timeOnline[guestSocketId] = new Date();

          // Build usernames map for this room only
          const roomUsernames = {};
          connections[path].forEach((sid) => {
            roomUsernames[sid] = usernames[sid] || `User-${sid.substring(0, 5)}`;
          });

          // Notify guest they are admitted
          io.to(guestSocketId).emit("role", "Member");

          // Notify all existing users in the room about the new guest, incl. Host
          connections[path].forEach((existingSocketId) => {
            io.to(existingSocketId).emit(
              "user-joined",
              guestSocketId,
              connections[path],
              roomUsernames
            );
          });

          // Broadcast updated participant list
          broadcastParticipantsList(path, io);

          // Send existing chat messages to the newly admitted guest
          if (messages[path] !== undefined && messages[path].length > 0) {
            messages[path].forEach((message) => {
              io.to(guestSocketId).emit(
                "chat-message",
                message.data,
                message.sender,
                message["socket-id-sender"]
              );
            });
          }
        } else {
          // Notify guest they were denied
          io.to(guestSocketId).emit("join-denied");
        }
      }
    });

    // Listen for client requests to get the latest participants map
    socket.on("request-participants", (path) => {
      const roomUsers = connections[path];
      if (roomUsers && roomUsers.includes(socket.id)) {
        const payload = roomUsers.map((sid) => ({
          socketId: sid,
          username: usernames[sid] || `User-${sid.substring(0, 5)}`,
          role: roomHosts[path] === sid ? "Host" : "Member"
        }));
        socket.emit("participants-update", payload);
      }
    });

    // Check if room exists before joining
    socket.on("check-room", (path) => {
      const exists = connections[path] !== undefined;
      socket.emit("room-status", { exists });
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

          // Clean up user data immediately for the leaving person
          delete timeOnline[socket.id];
          delete usernames[socket.id];

          // If Host leaves, end the meeting completely
          if (roomHosts[roomKey] === socket.id) {
            console.log("Host left room", roomKey, "Ending meeting.");
            // Tell everyone else to leave
            roomUsers.forEach((socketId) => {
              io.to(socketId).emit("meeting-ended");
            });

            // Also clear waiting room
            const waitingUsers = waitingRoom[roomKey] || [];
            waitingUsers.forEach((user) => {
              io.to(user.socketId).emit("meeting-ended");
            });

            // Cleanup server state
            delete connections[roomKey];
            delete messages[roomKey];
            delete roomHosts[roomKey];
            delete waitingRoom[roomKey];
          } else {
            // It's a member leaving, just remove them and notify others
            console.log("Removing user from room:", roomKey);

            connections[roomKey].splice(userIndex, 1);
          }

          break; // User should only be in one room
        }
      }

      // Check waiting rooms specifically if a user closed tab while waiting
      for (const [roomKey, waitingUsers] of Object.entries(waitingRoom)) {
        const index = waitingUsers.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
          waitingRoom[roomKey].splice(index, 1);
          delete usernames[socket.id];
          break;
        }
      }

      // Fallback cleanup user data if not caught in loop
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
