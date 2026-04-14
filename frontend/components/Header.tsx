"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type ActiveNav = "home" | "draws" | "crs" | "pathway" | "tracker" | "funds" | "dashboard" | "pricing" | "processing";

const NAV_ITEMS = [
  { href: "/", key: "home" as ActiveNav, label: "Processing Times", icon: "⏱" },
  { href: "/draws", key: "draws" as ActiveNav, label: "PR Draws", icon: "🗳" },
  { href: "/crs", key: "crs" as ActiveNav, label: "CRS Calculator", icon: "🧮" },
];

const MORE_TOOLS = [
  { href: "/pathway", key: "pathway" as ActiveNav, icon: "🗺️", label: "PR Pathway Finder", sub: "Which stream fits you?" },
  { href: "/tracker", key: "tracker" as ActiveNav, icon: "⏰", label: "Permit Expiry Tracker", sub: "Never miss your renewal" },
  { href: "/funds", key: "funds" as ActiveNav, icon: "💰", label: "Proof of Funds", sub: "How much money you need" },
  { href: "/dashboard", key: "dashboard" as ActiveNav, icon: "📊", label: "My Dashboard", sub: "Your PR eligibility" },
];

export default function Header({
  subtitle,
  activeNav,
  lastUpdated,
}: {
  subtitle?: string;
  activeNav?: ActiveNav;
  lastUpdated?: string | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenu(false);
  }, [activeNav]);

  async function signOut() {
    await supabase.auth.signOut();
    setUserMenu(false);
    setMobileMenu(false);
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";
  const isActive = (key: ActiveNav) => activeNav === key || (activeNav === "processing" && key === "home");

  return (
    <>
      <header className="canada-header px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo */}
        <a href="/" style={{ textDecoration: "none" }} className="flex-shrink-0">
          <h1 className="text-xl font-bold text-white leading-tight">🍁 IRCC Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            {subtitle || "Canada immigration — updated daily"}
          </p>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`canada-nav-link ${isActive(item.key) ? "active" : ""}`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </a>
          ))}

          {/* More Tools dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => { setMoreMenu(m => !m); setUserMenu(false); }}
              className={`canada-nav-link ${MORE_TOOLS.some(t => isActive(t.key)) ? "active" : ""}`}
            >
              More Tools
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {moreMenu && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "#0d1b35", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px", padding: "8px", minWidth: "240px", zIndex: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                {MORE_TOOLS.map(tool => (
                  <a key={tool.href} href={tool.href}
                    onClick={() => setMoreMenu(false)}
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px" }}
                    className={`hover:bg-white/5 transition-colors ${isActive(tool.key) ? "bg-white/5" : ""}`}>
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

          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden lg:block ml-2">
              Updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </span>
          )}
        </nav>

        {/* Right side: Auth + Mobile hamburger */}
        <div className="flex items-center gap-2">
          {/* Auth (desktop) */}
          <div className="hidden md:block">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setUserMenu(m => !m); setMoreMenu(false); }}
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
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenu(m => !m)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-[999] bg-[#060d1f]/98 backdrop-blur-lg overflow-y-auto"
          style={{ top: 0 }}>
          {/* Close header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <a href="/" style={{ textDecoration: "none" }}>
              <h1 className="text-xl font-bold text-white">🍁 IRCC Tracker</h1>
            </a>
            <button
              className="p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenu(false)}
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="px-4 py-6 space-y-6">
            {/* Track section */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Track</p>
              {[
                { href: "/", key: "home" as ActiveNav, icon: "⏱", label: "Processing Times", sub: "Visa wait times by country" },
                { href: "/draws", key: "draws" as ActiveNav, icon: "🗳", label: "PR Draws", sub: "Express Entry & Provincial" },
                { href: "/tracker", key: "tracker" as ActiveNav, icon: "⏰", label: "Permit Expiry Tracker", sub: "Never miss your renewal" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive(item.key) ? "bg-red-900/20 border border-red-500/30" : "hover:bg-white/5"}`}
                  style={{ textDecoration: "none" }}>
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Calculate section */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Calculate</p>
              {[
                { href: "/crs", key: "crs" as ActiveNav, icon: "🧮", label: "CRS Calculator", sub: "Calculate your score" },
                { href: "/funds", key: "funds" as ActiveNav, icon: "💰", label: "Proof of Funds", sub: "How much money you need" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive(item.key) ? "bg-red-900/20 border border-red-500/30" : "hover:bg-white/5"}`}
                  style={{ textDecoration: "none" }}>
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Plan section */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Plan</p>
              {[
                { href: "/pathway", key: "pathway" as ActiveNav, icon: "🗺️", label: "PR Pathway Finder", sub: "Which stream fits you?" },
                { href: "/dashboard", key: "dashboard" as ActiveNav, icon: "📊", label: "My Dashboard", sub: "Your PR eligibility" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive(item.key) ? "bg-red-900/20 border border-red-500/30" : "hover:bg-white/5"}`}
                  style={{ textDecoration: "none" }}>
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Account section */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Account</p>
              {user ? (
                <>
                  <p className="px-3 py-2 text-xs text-gray-500">{user.email}</p>
                  <button onClick={signOut}
                    className="w-full text-left px-3 py-3 text-sm text-red-400 hover:bg-white/5 rounded-xl transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <a href="/auth" onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ textDecoration: "none" }}>
                  <span className="text-lg">🔑</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Sign In</p>
                    <p className="text-xs text-gray-500">Free account, no credit card</p>
                  </div>
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
