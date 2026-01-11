import { useEffect, useState } from "react";
import GridTextBox from "./GridTextBox";
import { io } from "socket.io-client";
import Textbox from "./Textbox";

// --- Connect to backend ---
const socket = io(`http://${window.location.hostname}:5000`, {
  transports: ["websocket"],
  timeout: 5000,
});

export default function Editor({ docId }) {
  const [text, setText] = useState("");
  const [version, setVersion] = useState(0);

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
      setText(data.content);
      setVersion(data.version);
    });

    socket.on("update", (data) => {
      let change = data.changes;
      setVersion(data.version);
      setText((prev) => {
        if (change.type === "insert") {
          return (
            prev.slice(0, change.position) +
            change.character +
            prev.slice(change.position)
          );
        }

        if (change.type === "delete") {
          return (
            prev.slice(0, change.position) +
            prev.slice(change.position + change.len)
          );
        }

        return prev;
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

  const handleChange = (change) => {
    setText((prev) => {
      if (change.type === "insert") {
        console.log(change);
        return (
          prev.slice(0, change.position) +
          change.character +
          prev.slice(change.position)
        );
      }
      if (change.type === "delete") {
        return (
          prev.slice(0, change.position) +
          prev.slice(change.position + change.len)
        );
      }
      return prev;
    });

    socket.emit("edit", { doc_id: docId, version, changes: change });
  };

  return <Textbox value={text} onChange={handleChange} />;
}
