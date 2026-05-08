import type { Metadata } from "next";
import PageLayout from "@/components/PageLayout";
import { TOOLS, type ToolKey } from "@/lib/tools";

export const metadata: Metadata = {
  title: "About — IRCC Tracker",
  description:
    "IRCC Tracker is a free, independent set of Canada immigration tools — Express Entry draws, CRS calculator, PNP tracker, processing times — built by an immigrant for the next wave.",
};

const FOUNDER = {
  name: "Mahesh",
  brandInstagram: "https://www.instagram.com/ircc_tracker",
};

const TOOL_CATEGORIES: { title: string; icon: string; keys: ToolKey[] }[] = [
  {
    title: "Track the system",
    icon: "📊",
    keys: ["draws", "processing", "news", "tracker"],
  },
  {
    title: "Check your eligibility",
    icon: "🧮",
    keys: ["crs", "clb", "funds", "noc"],
  },
  {
    title: "Plan your path",
    icon: "🗺️",
    keys: ["pathway", "pnp", "checklist", "dashboard"],
  },
];

export default function AboutPage() {
  return (
    <PageLayout subtitle="Free tools, built by an immigrant" activeNav="about">
      {/* Hero */}
      <section className="text-center py-6">
        <div className="text-5xl mb-2">🍁</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">About IRCC Tracker</h1>
        <p className="mt-3 max-w-2xl mx-auto text-gray-300">
          We make Canada immigration data fast, free, and human-readable —
          so you don&apos;t have to pay a consultant for information IRCC publishes for free.
        </p>
      </section>

      {/* Why */}
      <section className="canada-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-3">Why this exists</h2>
        <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
          <p>
            Most Canada immigration websites are slow, buried in legalese, or built
            to upsell you a $500-an-hour consultant. The actual data — draws, processing
            times, CRS calculators, NOC codes — is free and public. It&apos;s just hard to
            find and harder to interpret.
          </p>
          <p>
            IRCC Tracker pulls directly from official Government of Canada sources every
            few hours and presents it in tools that anyone can use in under a minute.
            No accounts required. No paywalls on core information. No fake urgency.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">What you can do here</h2>
        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat.title} className="canada-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="text-base font-semibold text-white">{cat.title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.keys.map((key) => {
                const t = TOOLS[key];
                return (
                  <a
                    key={t.href}
                    href={t.href}
                    className="canada-feature-card p-4 hover:border-red-500/40 transition-colors"
                    style={{ textDecoration: "none" }}
                  >
                    <p className="text-sm font-semibold text-white">
                      <span className="mr-1.5">{t.icon}</span>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t.long}</p>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Founder */}
      <section className="canada-card p-6 sm:p-8" style={{ borderLeft: "4px solid #d52b1e" }}>
        <h2 className="text-xl font-semibold text-white mb-3">Who built this</h2>
        <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
          <p>
            Hi — I&apos;m {FOUNDER.name}. I went through the Canada immigration process myself
            and got tired of refreshing IRCC&apos;s website for draw updates, paying for tools
            that should be free, and getting bad advice from people who had every reason
            to charge me for it.
          </p>
          <p>
            So I built the website I wish existed when I was applying. It&apos;s free, it
            updates automatically, and it&apos;ll stay free for the core tools forever.
          </p>
          <p className="text-xs text-gray-500 pt-2">
            Follow{" "}
            <a
              href={FOUNDER.brandInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              @ircc_tracker
            </a>{" "}
            on Instagram — every Express Entry and PNP draw lands there minutes after IRCC publishes.
          </p>
        </div>
      </section>

      {/* Trust */}
      <section className="canada-card p-6">
        <h2 className="text-base font-semibold text-white mb-3">How we keep data fresh</h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-red-400">→</span>
            <span><strong className="text-white">Express Entry draws</strong> from canada.ca&apos;s official JSON, every 6 hours.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400">→</span>
            <span><strong className="text-white">Processing times</strong> from IRCC&apos;s official ptime feed, daily.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400">→</span>
            <span><strong className="text-white">News</strong> from IRCC&apos;s Atom feeds (news releases, media advisories, statements).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400">→</span>
            <span><strong className="text-white">PNP and policy data</strong> sourced from each province&apos;s official site.</span>
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Not affiliated with IRCC or the Government of Canada. We never store, sell, or share your personal data.
        </p>
      </section>

      {/* CTA */}
      <a href="/" className="canada-next-step" style={{ textDecoration: "none", cursor: "pointer" }}>
        <span className="text-2xl">🚀</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Ready to start?</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Pick your path on the home page — apply from outside, already in Canada, processing times, or CRS score.
          </p>
        </div>
        <span className="text-gray-400 text-sm whitespace-nowrap">Explore tools →</span>
      </a>
    </PageLayout>
  );
}
