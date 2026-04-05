"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
  type: "success" | "info";
  onDone: () => void;
}

export default function Toast({ message, type, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2000);
    const remove = setTimeout(onDone, 2500);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [onDone]);

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md text-sm font-medium pointer-events-none transition-opacity duration-500 whitespace-nowrap"
      style={{
        opacity: visible ? 1 : 0,
        backgroundColor: type === "success" ? "#dcfce7" : "#f5f5f4",
        color: type === "success" ? "#15803d" : "#57534e",
        border: `1px solid ${type === "success" ? "#bbf7d0" : "#e7e5e4"}`,
      }}
    >
      {type === "success" ? (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      )}
      {message}
    </div>
  );
}
