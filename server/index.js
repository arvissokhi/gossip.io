import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let waiting = null;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const tryMatch = () => {
    if (waiting && waiting !== socket) {
      const partner = waiting;
      const room = `room-${socket.id}-${partner.id}`;
      socket.join(room);
      partner.join(room);

      socket.emit("matched", room);
      partner.emit("matched", room);

      waiting = null;
    } else {
      waiting = socket;
    }
  };

  socket.on("find partner", () => {
    tryMatch();
  });

  socket.on("chat message", ({ room, message }) => {
    io.to(room).emit("chat message", { id: socket.id, text: message });
  });

  socket.on("disconnect", () => {
    if (waiting === socket) {
      waiting = null;
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
