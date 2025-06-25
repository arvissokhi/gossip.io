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
const userRoomMap = new Map(); // Maps socket.id -> room
const roomPartnerMap = new Map(); // Maps socket.id -> partner's socket

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const tryMatch = () => {
    if (waiting && waiting !== socket) {
      const partner = waiting;
      const room = `room-${socket.id}-${partner.id}`;

      socket.join(room);
      partner.join(room);

      userRoomMap.set(socket.id, room);
      userRoomMap.set(partner.id, room);
      roomPartnerMap.set(socket.id, partner);
      roomPartnerMap.set(partner.id, socket);

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

  socket.on("leave room", (room) => {
    const partner = roomPartnerMap.get(socket.id);
    if (partner) {
      partner.leave(room);
      partner.emit("partner left");
      roomPartnerMap.delete(partner.id);
    }

    socket.leave(room);
    userRoomMap.delete(socket.id);
    roomPartnerMap.delete(socket.id);
  });

  socket.on("disconnect", () => {
    const room = userRoomMap.get(socket.id);
    const partner = roomPartnerMap.get(socket.id);

    if (waiting === socket) {
      waiting = null;
    }

    if (room && partner) {
      partner.leave(room);
      partner.emit("partner left");
      roomPartnerMap.delete(partner.id);
    }

    userRoomMap.delete(socket.id);
    roomPartnerMap.delete(socket.id);

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
