"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Generic hook that wraps a Supabase query and exposes loading/error/data
 * state so every page can show a real loading spinner, real error message,
 * and real empty state instead of the silent `if (error) return` pattern
 * that previously hid Supabase outages from users.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     () => supabase.from('pr_draws').select('*').limit(100),
 *     [],
 *   );
 *
 * The query function is intentionally a thunk (not a Promise directly) so
 * we can re-invoke it on `refetch()` without the caller building a new
 * builder each render.
 *
 * Cancellation: if the dependencies change (or the component unmounts)
 * before the in-flight fetch resolves, the result of the older fetch is
 * discarded — prevents a "race" where a stale response overwrites a fresh
 * one.
 */
export type SupabaseResult<T> = {
  data: T | null;
  loading: boolean;
  /** Human-readable error message, or null. */
  error: string | null;
  /** Force a re-fetch (e.g. from an "Try again" button). */
  refetch: () => void;
};

type QueryThunk<T> = () => Promise<{ data: T | null; error: PostgrestError | null }>;

export function useSupabaseQuery<T>(
  buildQuery: QueryThunk<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[] = [],
): SupabaseResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Stash the builder in a ref so its identity changes don't trigger
  // re-fetch — only the explicit deps + tick do.
  const buildQueryRef = useRef(buildQuery);
  buildQueryRef.current = buildQuery;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    buildQueryRef.current()
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error.message || "Couldn't load this data — please try again.");
          setData(null);
        } else {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Network error — check your connection.");
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
