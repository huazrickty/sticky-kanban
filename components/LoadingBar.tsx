"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LoadingBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Reset and start
    setOpacity(1);
    setVisible(true);
    setWidth(0);

    // Ramp to 80% quickly
    const t1 = setTimeout(() => setWidth(80), 10);
    // Complete to 100%
    const t2 = setTimeout(() => setWidth(100), 300);
    // Fade out
    const t3 = setTimeout(() => setOpacity(0), 500);
    // Hide
    const t4 = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-50 h-[3px] bg-stone-600 dark:bg-stone-400 pointer-events-none"
      style={{
        width: `${width}%`,
        opacity,
        transition:
          opacity === 0
            ? "width 0.15s ease-out, opacity 0.2s ease-out"
            : "width 0.3s ease-out",
      }}
    />
  );
}
