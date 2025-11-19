import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// --- Connect to backend ---
const socket = io("http://10.147.139.220:5000", {
  transports: ["websocket"],
  timeout: 5000,
});

export default function Editor({ docId }) {
  const [text, setText] = useState("");

  useEffect(() => {
    // --- Debug logs ---
    socket.on("connect", () => {
      console.log("✅ CONNECTED TO BACKEND");
    });

    socket.on("connect_error", (err) => {
      console.log("❌ CONNECT ERROR:", err.message);
    });

    socket.on("error", (err) => {
      console.log("❌ SOCKET ERROR:", err);
    });

    socket.on("disconnect", () => {
      console.log("❌ DISCONNECTED FROM BACKEND");
    });

    // --- Join doc room ---
    socket.emit("join", { doc_id: docId });

    // --- Load initial content ---
    socket.on("load", (data) => {
      console.log("📥 LOAD EVENT:", data);
      setText(data.content);
    });

    // --- Receive updates from others ---
    socket.on("update", (data) => {
      console.log("📥 UPDATE EVENT:", data);
      setText(data.content);
    });

    return () => {
      socket.off("load");
      socket.off("update");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error");
      socket.off("connect_error");
    };
  }, [docId]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    socket.emit("edit", { doc_id: docId, content: value });
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      style={{
        width: "60vh",
        height: "40vh",
        fontSize: "16px",
      }}
    />
  );
}
