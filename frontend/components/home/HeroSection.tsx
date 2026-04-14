"use client";

export default function HeroSection({
  onScrollToProcessing,
}: {
  onScrollToProcessing: () => void;
}) {
  return (
    <section className="canada-hero rounded-2xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Track Your Canadian Immigration Journey
      </h1>
      <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-6">
        Real-time processing times, CRS scores, and free tools — all in one place
      </p>

      {/* Trust signals */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 mb-8">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Updated daily from IRCC
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          180+ countries tracked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          6 free tools
        </span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/pathway"
          className="canada-btn px-6 py-3 text-sm text-center"
          style={{ textDecoration: "none" }}
        >
          Find Your PR Pathway
        </a>
        <button
          onClick={onScrollToProcessing}
          className="canada-pill px-6 py-3 text-sm"
        >
          Check Processing Times
        </button>
      </div>
    </section>
  );
}
