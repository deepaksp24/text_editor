import { useState, useEffect } from "react";
import "./App.css";
import Editor from "./Editor";

function App() {
  const [docId, setDocId] = useState("");

  useEffect(() => {
    const id = prompt("Enter Document ID:");
    setDocId(id || "default");
  }, []);

  if (!docId) return null; // wait for input

  return <Editor docId={docId} />;
}

export default App;
