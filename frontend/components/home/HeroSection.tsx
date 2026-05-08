"use client";

// Slim hero — one tagline, one primary CTA, one secondary CTA.
// The 4 main paths live in ChooseYourPath right below; the full tool
// list lives in ToolsByGroup. Hero is just the brand statement.

export default function HeroSection() {
  return (
    <section className="canada-hero rounded-2xl" style={{ paddingBottom: 40 }}>
      {/* Live badge */}
      <div className="flex justify-center mb-4">
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#34d399",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#10b981",
            display: "inline-block",
            boxShadow: "0 0 0 0 rgba(16,185,129,0.4)",
            animation: "pulse-dot 2s infinite",
          }} />
          Live data · Updated daily from IRCC
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Your Canada Immigration<br className="hidden sm:block" />{" "}
        <span style={{ color: "#d52b1e" }}>Command Centre</span>
      </h1>
      <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-7">
        CRS calculator, processing times, draw history, and free immigration tools — all in one place. No lawyer needed to get started.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/pathway"
          className="canada-btn px-6 py-3 text-sm text-center"
          style={{ textDecoration: "none", boxShadow: "0 4px 20px rgba(213,43,30,0.35)" }}
        >
          Find My PR Pathway →
        </a>
        <a
          href="/processing"
          className="canada-pill px-6 py-3 text-sm text-center"
          style={{ textDecoration: "none" }}
        >
          Check Processing Times
        </a>
      </div>
    </section>
  );
}
