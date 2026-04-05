"use client";

import { useEffect, useState } from "react";

const HINTS: { key: string; label: string }[] = [
  { key: "N", label: "New task" },
  { key: "Esc", label: "Close" },
  { key: "1", label: "To Do" },
  { key: "2", label: "Ongoing" },
  { key: "3", label: "Done" },
];

export default function KeyboardHints() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-3 px-3.5 py-2 rounded-full transition-opacity duration-500"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
      }}
    >
      {HINTS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5">
          <kbd
            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-white font-mono leading-none"
            style={{
              fontSize: "10px",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.22)",
              minWidth: "20px",
            }}
          >
            {key}
          </kbd>
          <span className="text-white/70" style={{ fontSize: "11px" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
