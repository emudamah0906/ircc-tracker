// Standard footer for any page that uses hardcoded reference data from IRCC.
// Shows: when the data was last verified, where it came from, and how often
// IRCC updates it. Goes at the bottom of every calculator/lookup page.

type Props = {
  lastVerified: string;
  source: string;
  sourceLabel: string;
  cadence: "annually" | "quarterly" | "monthly" | "as-needed";
  note?: string;
};

const CADENCE_COPY: Record<Props["cadence"], string> = {
  annually:    "IRCC updates this annually",
  quarterly:   "IRCC updates this each quarter",
  monthly:     "Provincial rules change monthly",
  "as-needed": "IRCC updates this as needed",
};

function formatVerified(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function staleDays(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export default function DataFreshness({
  lastVerified, source, sourceLabel, cadence, note,
}: Props) {
  const days = staleDays(lastVerified);
  const isStale =
    (cadence === "annually" && days > 365) ||
    (cadence === "quarterly" && days > 120) ||
    (cadence === "monthly" && days > 45);

  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{
        background: isStale ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
        border: isStale
          ? "1px solid rgba(245,158,11,0.25)"
          : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-base leading-none mt-0.5">{isStale ? "⚠️" : "ℹ️"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300">
            <span className="font-semibold text-white">
              Last verified: {formatVerified(lastVerified)}
            </span>
            <span className="text-gray-500"> · {CADENCE_COPY[cadence]}</span>
            {isStale && (
              <span className="ml-2 text-yellow-400 font-medium">
                · may be out of date
              </span>
            )}
          </p>
          {note && (
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{note}</p>
          )}
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
          >
            Verify on {sourceLabel} →
          </a>
        </div>
      </div>
    </div>
  );
}
