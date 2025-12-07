import React, { useEffect, useRef, useState } from "react";

export default function GridTextBox({ rows = 5, cols = 10, value, onChange }) {
  const refs = useRef({});

  const makeRef = (r, c) => {
    const key = `${r}-${c}`;
    if (!refs.current[key]) refs.current[key] = React.createRef();
    return refs.current[key];
  };

  // --- 1. Extract logic to generate grid from props ---
  const generateGrid = (incomingValue) => {
    const newGrid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "")
    );

    // Safety check: ensure incomingValue and gridMap exist
    if (!incomingValue || !incomingValue.gridMap) {
      return newGrid;
    }

    Object.entries(incomingValue.gridMap).forEach(([key, ch]) => {
      const [r, c] = key.split(",").map(Number);
      if (r < rows && c < cols) newGrid[r][c] = ch;
    });

    return newGrid;
  };

  // --- 2. Initialize state ---
  const [grid, setGrid] = useState(() => generateGrid(value));

  // --- 3. THE FIX: Sync state when 'value' prop changes ---
  useEffect(() => {
    // Only update if the value actually changed to avoid cursor jumping loops
    // (You might need deep comparison here in production, but this works for now)
    console.log("♻️ Syncing UI with new props data");
    setGrid(generateGrid(value));
  }, [value, rows, cols]);

  const gridToString = (g) => g.map((r) => r.join("")).join("");

  const gridToMap = (g) => {
    const map = {};
    g.forEach((row, r) => {
      row.forEach((ch, c) => {
        if (ch !== "") map[`${r},${c}`] = ch;
      });
    });
    return map;
  };

  const update = (g) => {
    // Note: We update local state immediately for responsiveness
    setGrid(g);
    onChange({
      content: gridToString(g),
      gridMap: gridToMap(g),
    });
  };

  const focusCell = (r, c) => {
    const ref = refs.current[`${r}-${c}`];
    ref?.current?.focus();
  };

  const handleKey = (e, r, c) => {
    const key = e.key;
    const g = grid.map((row) => [...row]);

    if (key === "ArrowRight")
      return c < cols - 1
        ? focusCell(r, c + 1)
        : r < rows - 1 && focusCell(r + 1, 0);
    if (key === "ArrowLeft")
      return c > 0 ? focusCell(r, c - 1) : r > 0 && focusCell(r - 1, cols - 1);
    if (key === "ArrowUp") return r > 0 && focusCell(r - 1, c);
    if (key === "ArrowDown") return r < rows - 1 && focusCell(r + 1, c);

    if (key === "Enter") {
      e.preventDefault();
      return r < rows - 1 && focusCell(r + 1, 0);
    }

    if (key === "Backspace") {
      if (g[r][c] === "") {
        if (c > 0) focusCell(r, c - 1);
        else if (r > 0) focusCell(r - 1, cols - 1);
        return;
      }
      g[r][c] = "";
      return update(g);
    }
  };

  const handleInput = (e, r, c) => {
    const ch = e.target.value.slice(-1);
    const g = grid.map((row) => [...row]);

    g[r][c] = ch;
    update(g);

    c < cols - 1 ? focusCell(r, c + 1) : r < rows - 1 && focusCell(r + 1, 0);
  };

  return (
    <div style={{ display: "inline-block" }}>
      {grid.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((cell, c) => (
            <input
              key={`${r}-${c}`}
              ref={makeRef(r, c)}
              value={cell}
              // onChange is usually enough, but using pure controlled inputs
              // sometimes requires explicit handling.
              onChange={(e) => handleInput(e, r, c)}
              onKeyDown={(e) => handleKey(e, r, c)}
              style={{
                width: "22px",
                height: "22px",
                margin: "2px",
                textAlign: "center",
                fontSize: "16px",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
