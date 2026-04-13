"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header({
  subtitle,
  activeNav,
  lastUpdated,
}: {
  subtitle?: string;
  activeNav?: "processing" | "draws" | "crs";
  lastUpdated?: string | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <header className="canada-header px-6 py-4 flex items-center justify-between">
      <div>
        <a href="/" style={{ textDecoration: "none" }}>
          <h1 className="text-2xl font-bold text-white">🍁 IRCC Tracker</h1>
        </a>
        <p className="text-sm text-gray-400 mt-0.5">
          {subtitle || "Canada immigration wait times — updated daily"}
        </p>
      </div>

      <nav className="flex items-center gap-2">
        <a href="/draws" className={`canada-pill ${activeNav === "draws" ? "active" : ""}`}>
          🗳 PR Draws
        </a>
        <a href="/crs" className={`canada-pill ${activeNav === "crs" ? "active" : ""}`}>
          🧮 CRS Score
        </a>

        {lastUpdated && (
          <span className="text-xs text-gray-500 hidden md:block ml-2">
            Updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}

        {/* Auth */}
        {user ? (
          <div className="relative ml-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: "34px", height: "34px",
                background: "linear-gradient(135deg, #d52b1e, #a01208)",
                border: "none", borderRadius: "50%",
                color: "white", fontSize: "12px", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {initials}
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute", right: 0, top: "42px",
                  background: "#0d1b35", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", padding: "8px", minWidth: "180px", zIndex: 100,
                }}
              >
                <p style={{ fontSize: "11px", color: "#9ca3af", padding: "6px 10px 4px", margin: 0 }}>
                  {user.email}
                </p>
                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "4px 0" }} />
                <a
                  href="/dashboard"
                  style={{ display: "block", padding: "8px 10px", fontSize: "13px", color: "#e2e8f0", textDecoration: "none", borderRadius: "8px" }}
                  className="hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  📊 My Dashboard
                </a>
                <button
                  onClick={signOut}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 10px", fontSize: "13px", color: "#f87171",
                    background: "none", border: "none", cursor: "pointer", borderRadius: "8px",
                  }}
                  className="hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/auth"
            className="canada-pill"
            style={{ background: "linear-gradient(135deg, #d52b1e, #a01208)", borderColor: "transparent", color: "white" }}
          >
            Sign In
          </a>
        )}
      </nav>
    </header>
  );
}
