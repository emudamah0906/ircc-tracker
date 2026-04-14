"use client";

import { useState, useEffect } from "react";

export default function QuickStartPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const returning = localStorage.getItem("ircc_returning");
      if (!returning) {
        setVisible(true);
      }
    }
  }, []);

  function dismiss() {
    localStorage.setItem("ircc_returning", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="canada-next-step">
      <span className="text-2xl">🗺️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">First time here?</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Take our 2-minute Pathway Finder quiz to discover which immigration streams fit your profile
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/pathway"
          className="canada-btn text-xs px-4 py-2 whitespace-nowrap"
          style={{ textDecoration: "none" }}
        >
          Take the Quiz
        </a>
        <button
          onClick={dismiss}
          className="text-gray-500 hover:text-gray-300 text-lg px-2"
          aria-label="Dismiss"
        >
          x
        </button>
      </div>
    </div>
  );
}
