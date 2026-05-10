import { supabase } from "@/lib/supabase";

/**
 * Site-wide trust banner. Shows the real "last IRCC sync" timestamp from
 * scraper_health (populated by the GitHub Actions cron) plus three honest,
 * always-true assertions: source, free, and the methodology link.
 *
 * Why a server component: the freshness number should be tied to real
 * Supabase data, not fabricated. Server-rendering means each request
 * reflects the current state without shipping a Supabase round-trip to
 * every visitor's browser. Vercel cache TTL of 5 min is fine here — we
 * display freshness at hour precision so a 5-min lag is invisible.
 *
 * Data source rationale: we read processing_times row instead of draws
 * because processing_times is the only scraper that writes a row on
 * EVERY successful run (the other two only insert when IRCC publishes
 * something new — checking their freshness would conflate "scraper
 * broken" with "IRCC quiet this week").
 */

const FRESHNESS_QUERY_REVALIDATE_S = 300; // 5 min — short enough to feel live, long enough to skip the round-trip on most renders

async function fetchLastIrccSync(): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from("scraper_health")
      .select("last_success_at")
      .eq("scraper_name", "processing_times")
      .single();
    if (error || !data?.last_success_at) return null;
    return new Date(data.last_success_at);
  } catch {
    // Best-effort: a Supabase outage shouldn't break every page render.
    // Banner falls through to the "freshness unknown" copy below.
    return null;
  }
}

function formatRelative(when: Date | null): string {
  if (!when) return "checking…";
  const ms = Date.now() - when.getTime();
  if (ms < 0) return "just now";
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  // If we ever see "30+ days ago" something is broken — but render rather
  // than throw so the banner never crashes the layout.
  return when.toISOString().slice(0, 10);
}

export const revalidate = FRESHNESS_QUERY_REVALIDATE_S;

export default async function TrustBanner() {
  const lastSync = await fetchLastIrccSync();
  const freshness = formatRelative(lastSync);
  // 'stale' if we couldn't reach Supabase OR the last successful sync is
  // older than 12h — both signals deserve a visible color shift instead
  // of pretending data is fresh.
  const isStale = !lastSync
    || (Date.now() - lastSync.getTime()) > 12 * 60 * 60 * 1000;

  return (
    <div
      className={`w-full border-b text-xs ${
        isStale
          ? "bg-amber-950/40 border-amber-800/40 text-amber-200"
          : "bg-white/[0.03] border-white/5 text-gray-400"
      }`}
      role="region"
      aria-label="Site freshness and source"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">🔄</span>
          <span>
            {isStale && lastSync ? "Last IRCC sync (stale): " : "Last IRCC sync: "}
            <span className={isStale ? "font-semibold text-amber-100" : "font-semibold text-gray-200"}>
              {freshness}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
          <span className="hidden sm:inline-flex items-center gap-1">
            <span aria-hidden="true">🍁</span>
            Sourced from canada.ca
          </span>
          <span className="hidden md:inline">Free · no signup</span>
          <a
            href="/methodology"
            className="underline decoration-dotted hover:text-white transition-colors"
          >
            How we work →
          </a>
        </div>
      </div>
    </div>
  );
}
