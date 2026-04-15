"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";

type NewsItem = {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  published_at: string;
  source: string;
};

const PAGE_SIZE = 25;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchNews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from("ircc_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(500);
    setNews(data || []);
    setLastRefresh(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    const channel = supabase
      .channel("ircc_news_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ircc_news" },
        () => fetchNews(true)
      )
      .subscribe();
    const poll = setInterval(() => fetchNews(true), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNews(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchNews]);

  const filtered = search.trim()
    ? news.filter((n) => {
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          (n.summary?.toLowerCase().includes(q) ?? false)
        );
      })
    : news;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout subtitle="IRCC News & Updates" activeNav="news">
      <div>
        <h1 className="text-2xl font-bold">📰 IRCC News</h1>
        <p className="text-gray-400 text-sm mt-1">
          Latest immigration updates, program changes, and announcements from IRCC
        </p>
      </div>

      {/* Live indicator + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {lastRefresh && (
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · updated {lastRefresh.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        <span className="text-xs text-gray-500">
          {filtered.length} {filtered.length === 1 ? "article" : "articles"}
        </span>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="canada-input py-2.5 text-sm pl-9"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
          >
            x
          </button>
        )}
      </div>

      {/* News list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading news...</div>
      ) : filtered.length === 0 ? (
        <div className="canada-card p-10 text-center text-gray-500 text-sm">
          {search
            ? `No news found matching "${search}"`
            : "No news yet. The scraper runs on a schedule — check back shortly."}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="canada-card p-4 block hover:border-red-500/30 transition-colors"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-white leading-snug flex-1 min-w-[200px]">
                  {item.title}
                </h2>
                <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                  {timeAgo(item.published_at)}
                </span>
              </div>
              {item.summary && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">
                  {new Date(item.published_at).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-red-400">Read on {item.source} →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
            >
              »
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center pt-4">
        News aggregated from{" "}
        <a
          href="https://www.canada.ca/en/immigration-refugees-citizenship/news.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400"
        >
          canada.ca — IRCC newsroom
        </a>
        . ircctracker.org is not affiliated with IRCC or the Government of Canada.
      </p>
    </PageLayout>
  );
}
