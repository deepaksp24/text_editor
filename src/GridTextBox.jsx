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
    const newGridData = generateGrid(value);
    if (JSON.stringify(newGridData) !== JSON.stringify(grid)) {
      console.log("♻️ Syncing UI with new props data");
      setGrid(newGridData);
    }
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

    if (key === "ArrowRight") {
      e.preventDefault();
      return c < cols - 1
        ? focusCell(r, c + 1)
        : r < rows - 1 && focusCell(r + 1, 0);
    }
    if (key === "ArrowLeft") {
      e.preventDefault();
      return c > 0 ? focusCell(r, c - 1) : r > 0 && focusCell(r - 1, cols - 1);
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      return r > 0 && focusCell(r - 1, c);
    }
    if (key === "ArrowDown") {
      e.preventDefault();
      return r < rows - 1 && focusCell(r + 1, c);
    }

    if (key === "Enter") {
      e.preventDefault();
      return r < rows - 1 && focusCell(r + 1, 0);
    }

    if (key === "Backspace") {
      e.preventDefault(); 
      if (grid[r][c] !== "") {
        updateCell(r, c, "");
      }

      // 2. ALWAYS move back (Navigation)
      // This runs for both empty and non-empty cells
      if (c > 0) {
        focusCell(r, c - 1);
      } else if (r > 0) {
        focusCell(r - 1, cols - 1);
      }
    }
  };

  const updateCell = (r, c, newValue) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      newGrid[r][c] = newValue;
      return newGrid;
    });
    onChange({
      key: `${r},${c}`,
      value: newValue === "" ? null : newValue,
    });
  };

  const handleInput = (e, r, c) => {
    const ch = e.target.value.slice(-1);
    updateCell(r, c, ch);

    if (ch) {
      c < cols - 1 ? focusCell(r, c + 1) : r < rows - 1 && focusCell(r + 1, 0);
    }
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
