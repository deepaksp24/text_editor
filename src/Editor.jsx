import { useEffect, useState } from "react";
import GridTextBox from "./GridTextBox";
import { io } from "socket.io-client";

// --- Connect to backend ---
const socket = io(`http://${window.location.hostname}:5000`, {
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

    // --- Join doc room ---
    socket.emit("join", { doc_id: docId });

    // --- Load initial content ---
    socket.on("load", (data) => {
      console.log("📥 LOAD EVENT:", data);
      setText(data);
    });

    socket.on("update", (changes) => {
      console.log("📥 DELTA UPDATE:", changes);

      setText((prevData) => {
        const currentMap = prevData.gridMap ? { ...prevData.gridMap } : {};

        Object.entries(changes).forEach(([key, value]) => {
          if (value === null) {
            delete currentMap[key];
          } else {
            currentMap[key] = value;
          }
        });

        return {
          ...prevData,
          gridMap: currentMap,
        };
      });
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
    <GridTextBox
      rows={10}
      cols={20}
      value={text}
      onChange={({ key, value }) => {
        const changes = { [key]: value };
        console.log("Sending Change:", changes);
        setText((prev) => {
          const newMap = prev.gridMap ? { ...prev.gridMap } : {};

          if (value === null || value === "") {
            delete newMap[key];
          } else {
            newMap[key] = value;
          }
          return { ...prev, gridMap: newMap };
        });

        socket.emit("edit", { doc_id: docId, changes: changes });
      }}
    />
  );
}
