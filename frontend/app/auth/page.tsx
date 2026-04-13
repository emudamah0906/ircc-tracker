"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Tab = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (tab === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setSuccess("Account created! Check your email to confirm, then sign in.");

    } else if (tab === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else {
        const from = new URLSearchParams(window.location.search).get("from") || "/";
        router.push(from);
      }

    } else if (tab === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (err) setError(err.message);
      else setSuccess("Password reset link sent! Check your inbox (and spam folder).");
    }

    setLoading(false);
  }

  return (
    <div className="canada-bg min-h-screen text-white flex flex-col">
      <div className="canada-topbar" />

      <div className="px-6 py-4">
        <a href="/" className="text-gray-400 hover:text-white text-sm flex items-center gap-2" style={{ textDecoration: "none" }}>
          ← Back to IRCC Tracker
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🍁</div>
            <h1 className="text-2xl font-bold">IRCC Tracker</h1>
            <p className="text-gray-400 text-sm mt-1">Track your immigration journey</p>
          </div>

          <div className="canada-card p-7">

            {/* Tabs — only show signin/signup, forgot is a sub-view */}
            {tab !== "forgot" && (
              <div className="flex rounded-lg overflow-hidden mb-6" style={{ background: "rgba(255,255,255,0.05)" }}>
                {(["signin", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    style={{
                      flex: 1, padding: "9px", fontSize: "13px", fontWeight: 600,
                      border: "none", cursor: "pointer", transition: "all 0.2s",
                      background: tab === t ? "linear-gradient(135deg, #d52b1e, #a01208)" : "transparent",
                      color: tab === t ? "white" : "#9ca3af",
                      borderRadius: "6px",
                    }}
                  >
                    {t === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            )}

            {/* Forgot password header */}
            {tab === "forgot" && (
              <div className="mb-5">
                <button
                  onClick={() => switchTab("signin")}
                  className="text-gray-400 hover:text-white text-xs flex items-center gap-1 mb-3"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  ← Back to Sign In
                </button>
                <h2 className="text-base font-semibold text-white">Reset your password</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="canada-input"
                />
              </div>

              {tab !== "forgot" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-400">Password</label>
                    {tab === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchTab("forgot")}
                        className="text-xs text-red-400 hover:text-red-300"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={tab === "signup" ? "At least 6 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="canada-input"
                  />
                  {tab === "signup" && (
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  )}
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#f87171" }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#4ade80" }}>
                  {success}
                </div>
              )}

              {!success && (
                <button
                  type="submit"
                  disabled={loading}
                  className="canada-btn w-full"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading
                    ? "Please wait..."
                    : tab === "signin" ? "Sign In"
                    : tab === "signup" ? "Create Free Account"
                    : "Send Reset Link"}
                </button>
              )}
            </form>

            {tab === "signin" && (
              <p className="text-center text-xs text-gray-500 mt-4">
                Don&apos;t have an account?{" "}
                <button onClick={() => switchTab("signup")} className="text-red-400 hover:text-red-300" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Sign up free
                </button>
              </p>
            )}
            {tab === "signup" && (
              <p className="text-center text-xs text-gray-500 mt-4">
                Already have an account?{" "}
                <button onClick={() => switchTab("signin")} className="text-red-400 hover:text-red-300" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Sign in
                </button>
              </p>
            )}
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Free account · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
