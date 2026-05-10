/**
 * Shared loading / error / empty state visuals used by every page that
 * fetches data. Replaces the silent `if (error) return` pattern that used
 * to leave the page stuck on "Loading…" forever during a Supabase outage.
 */

export function LoadingState({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="canada-card p-8 text-center" role="status" aria-live="polite">
      <div className="inline-flex items-center gap-3 text-sm text-gray-400">
        <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  /** Optional context hint shown in smaller text below the message. */
  hint,
}: {
  message?: string | null;
  onRetry?: () => void;
  hint?: string;
}) {
  return (
    <div
      className="canada-card p-6 border border-red-700/40 bg-red-950/20"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">⚠️</span>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-red-300">
            Couldn&apos;t load this data
          </p>
          <p className="text-xs text-gray-400 break-words">
            {message || "Network or server error — try again in a moment."}
          </p>
          {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  emoji = "🤷",
  title = "Nothing here yet",
  body,
}: {
  emoji?: string;
  title?: string;
  body?: string;
}) {
  return (
    <div className="canada-card p-10 text-center">
      <div className="text-4xl mb-3" aria-hidden="true">{emoji}</div>
      <p className="text-sm font-semibold text-gray-200">{title}</p>
      {body && <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">{body}</p>}
    </div>
  );
}
