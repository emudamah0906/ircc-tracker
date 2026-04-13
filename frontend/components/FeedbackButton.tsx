"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    await supabase.from("feedback").insert({ message, email: email || null });
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setMessage(""); setEmail(""); }, 2000);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999,
          background: "linear-gradient(135deg, #d52b1e, #a01208)",
          color: "white",
          border: "none",
          borderRadius: "999px",
          padding: "10px 18px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(213,43,30,0.4)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
            padding: "24px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "#0d1b35",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "24px",
            width: "100%",
            maxWidth: "360px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>Share Feedback</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#9ca3af" }}>
              Found a bug? Have a suggestion? We read every message.
            </p>

            {submitted ? (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #16a34a", borderRadius: "8px", padding: "12px", color: "#4ade80", fontSize: "13px", textAlign: "center" }}>
                Thanks! Your feedback helps us improve 🙏
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea
                  placeholder="What's on your mind? Bug, feature request, anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={3}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    padding: "10px 12px",
                    fontSize: "13px",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="email"
                  placeholder="Email (optional — if you want a reply)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    padding: "10px 12px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #d52b1e, #a01208)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Send Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
