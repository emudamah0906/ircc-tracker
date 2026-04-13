"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const TOOLS = [
  { href: "/pathway", icon: "🗺️", label: "PR Pathway Finder", sub: "Which stream fits you?" },
  { href: "/tracker", icon: "⏰", label: "Permit Expiry Tracker", sub: "Never miss your renewal" },
  { href: "/funds", icon: "💰", label: "Proof of Funds", sub: "How much money you need" },
  { href: "/crs", icon: "🧮", label: "CRS Calculator", sub: "Calculate your score" },
  { href: "/draws", icon: "🗳️", label: "PR Draws", sub: "Latest Express Entry draws" },
  { href: "/dashboard", icon: "📊", label: "My Dashboard", sub: "Your PR eligibility" },
];

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
  const [userMenu, setUserMenu] = useState(false);
  const [toolsMenu, setToolsMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handle() { setUserMenu(false); setToolsMenu(false); }
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUserMenu(false);
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <header className="canada-header px-4 py-3 flex items-center justify-between gap-2">
      <div>
        <a href="/" style={{ textDecoration: "none" }}>
          <h1 className="text-xl font-bold text-white leading-tight">🍁 IRCC Tracker</h1>
        </a>
        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
          {subtitle || "Canada immigration — updated daily"}
        </p>
      </div>

      <nav className="flex items-center gap-1.5 flex-wrap justify-end">

        {/* Tools dropdown */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setToolsMenu(m => !m); setUserMenu(false); }}
            className={`canada-pill flex items-center gap-1 ${toolsMenu ? "active" : ""}`}
            style={{ fontSize: "12px", padding: "5px 12px" }}
          >
            🛠 Tools
            <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {toolsMenu && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)",
              background: "#0d1b35", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", padding: "8px", minWidth: "230px", zIndex: 200,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              {TOOLS.map(tool => (
                <a key={tool.href} href={tool.href}
                  onClick={() => setToolsMenu(false)}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px" }}
                  className="hover:bg-white/5 transition-colors">
                  <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{tool.icon}</span>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#f0f4ff", margin: 0 }}>{tool.label}</p>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{tool.sub}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <a href="/draws" className={`canada-pill ${activeNav === "draws" ? "active" : ""}`}
          style={{ fontSize: "12px", padding: "5px 12px" }}>
          🗳 PR Draws
        </a>

        {lastUpdated && (
          <span className="text-xs text-gray-500 hidden lg:block">
            Updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
          </span>
        )}

        {/* Auth */}
        {user ? (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setUserMenu(m => !m); setToolsMenu(false); }}
              style={{
                width: "32px", height: "32px",
                background: "linear-gradient(135deg, #d52b1e, #a01208)",
                border: "none", borderRadius: "50%",
                color: "white", fontSize: "11px", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {initials}
            </button>
            {userMenu && (
              <div style={{
                position: "absolute", right: 0, top: "40px",
                background: "#0d1b35", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px", padding: "8px", minWidth: "180px", zIndex: 200,
              }}>
                <p style={{ fontSize: "11px", color: "#9ca3af", padding: "6px 10px 4px", margin: 0 }}>
                  {user.email}
                </p>
                <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "4px 0" }} />
                <a href="/dashboard" onClick={() => setUserMenu(false)}
                  style={{ display: "block", padding: "8px 10px", fontSize: "13px", color: "#e2e8f0", textDecoration: "none", borderRadius: "8px" }}
                  className="hover:bg-white/5">
                  📊 My Dashboard
                </a>
                <button onClick={signOut}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", fontSize: "13px", color: "#f87171", background: "none", border: "none", cursor: "pointer", borderRadius: "8px" }}
                  className="hover:bg-white/5">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <a href="/auth" className="canada-pill"
            style={{ background: "linear-gradient(135deg, #d52b1e, #a01208)", borderColor: "transparent", color: "white", fontSize: "12px", padding: "5px 12px" }}>
            Sign In
          </a>
        )}
      </nav>
    </header>
  );
}
