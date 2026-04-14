"use client";

import { setJourneyType } from "@/lib/journey";

export default function JourneyPicker({
  onSelectLocation,
}: {
  onSelectLocation: (location: "outside" | "inside") => void;
}) {
  function handleSelect(loc: "outside" | "inside") {
    setJourneyType(loc);
    onSelectLocation(loc);
  }
  return (
    <section>
      <h2 className="text-center text-lg font-semibold text-white mb-5">
        Where are you in your journey?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outside Canada */}
        <div
          className="canada-cta-card"
          onClick={() => handleSelect("outside")}
        >
          <div className="text-4xl mb-3">✈️</div>
          <h3 className="text-lg font-bold text-white mb-2">
            I want to move to Canada
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Find your pathway, calculate your CRS score, and track Express Entry draws
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {["Pathway Finder", "CRS Calculator", "PR Draws"].map((step) => (
              <span key={step} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {step}
              </span>
            ))}
          </div>
          <span className="canada-btn inline-block px-5 py-2 text-sm">
            Find Your Pathway
          </span>
        </div>

        {/* Inside Canada */}
        <div
          className="canada-cta-card"
          onClick={() => handleSelect("inside")}
        >
          <div className="text-4xl mb-3">🇨🇦</div>
          <h3 className="text-lg font-bold text-white mb-2">
            I&apos;m already in Canada
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Track permit expiry, check processing times, and manage your PR journey
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {["Permit Tracker", "Processing Times", "Dashboard"].map((step) => (
              <span key={step} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {step}
              </span>
            ))}
          </div>
          <span className="canada-pill inline-block px-5 py-2 text-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
            Track My Permit
          </span>
        </div>
      </div>
    </section>
  );
}
