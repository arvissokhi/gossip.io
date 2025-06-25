import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("https://gossip-io-lyst.onrender.com");

function App() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);

  // Emit find partner on load
  useEffect(() => {
    socket.emit("find partner");
  }, []);

  useEffect(() => {
    socket.on("matched", (room) => {
      setRoom(room);
      setMessages([]); // Clear messages when matched with a new partner
      console.log("Matched to room:", room);
    });

    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("matched");
      socket.off("chat message");
    };
  }, []);

  // 🔗 Handle when the partner disconnects
  useEffect(() => {
    socket.on("partner left", () => {
      setRoom(null);
      setMessages([]);
      alert("Your partner left. Finding a new one...");
      socket.emit("find partner");
    });

    return () => {
      socket.off("partner left");
    };
  }, []);

  const sendMessage = () => {
    if (msg.trim() && room) {
      socket.emit("chat message", { room, message: msg });
      setMsg("");
    }
  };

  const findNewPartner = () => {
    if (room) {
      socket.emit("leave room", room);
    }
    setMessages([]);
    setRoom(null);
    socket.emit("find partner");
  };

  return (
    <div className="App">
      {/* Header */}
      <div className="header">
        <img src="/logo.png" alt="Anonymous Chat" className="logo-avatar" />
        <h1 className="app-title">gossip.io</h1>
      </div>

      {/* Chat Box */}
      <div className="chat-box">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message ${m.id === socket.id ? "self" : "other"}`}
          >
            <strong>{m.id.slice(0, 5)}:</strong> {m.text}
          </div>
        ))}
      </div>

      {/* Find New Partner Button */}
      <button className="new-partner-btn" onClick={findNewPartner}>
        Find New Partner
      </button>

      {/* Message Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={room ? "Type message..." : "Waiting for a match..."}
          disabled={!room}
        />
        <button type="submit" disabled={!room || !msg.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
