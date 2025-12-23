import { useEffect, useRef } from "react";

export default function Textbox({ value, onChange }) {
  const prevValue = useRef(value);
  const textareaRef = useRef(null);
  const cursorRef = useRef(0);

  // restore cursor after value updates (remote edits)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.selectionStart = el.selectionEnd = cursorRef.current;
    prevValue.current = value;
  }, [value]);

  const handleChange = (e) => {
    const el = e.target;
    cursorRef.current = el.selectionStart;

    const newValue = el.value;
    const oldValue = prevValue.current;

    let i = 0;
    while (
      i < oldValue.length &&
      i < newValue.length &&
      oldValue[i] === newValue[i]
    )
      i++;

    if (newValue.length > oldValue.length) {
      const len = newValue.length - oldValue.length;
      onChange({
        type: "insert",
        character: newValue.slice(i, i + len),
        position: i,
        len,
      });
    } else if (newValue.length < oldValue.length) {
      onChange({
        type: "delete",
        position: i,
        len: oldValue.length - newValue.length,
      });
    }

    prevValue.current = newValue;
  };

  return (
    <textarea
      ref={textareaRef}
      rows={5}
      style={{ width: "100%" }}
      value={value}
      onChange={handleChange}
    />
  );
}
