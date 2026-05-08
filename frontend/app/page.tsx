"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import ChooseYourPath from "@/components/home/ChooseYourPath";
import ToolsByGroup from "@/components/home/ToolsByGroup";
import QuickStartPrompt from "@/components/home/QuickStartPrompt";

type NewsItem = {
  id: number;
  title: string;
  url: string;
  published_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [latestCRS, setLatestCRS] = useState<number | null>(null);
  const [latestDrawDate, setLatestDrawDate] = useState<string | null>(null);
  const [latestNews, setLatestNews] = useState<NewsItem | null>(null);
  const [processingFreshness, setProcessingFreshness] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: draws }, { data: news }, { data: ptimes }] = await Promise.all([
      supabase.from("pr_draws").select("crs_score, draw_date").is("province", null).order("draw_date", { ascending: false }).limit(1),
      supabase.from("ircc_news").select("id, title, url, published_at").order("published_at", { ascending: false }).limit(1),
      supabase.from("latest_processing_times").select("fetched_at").limit(1),
    ]);
    if (draws?.length) {
      setLatestCRS(draws[0].crs_score);
      setLatestDrawDate(draws[0].draw_date);
    }
    if (news?.length) setLatestNews(news[0]);
    if (ptimes?.length) setProcessingFreshness(ptimes[0].fetched_at);
  }, []);

  useEffect(() => {
    fetchData();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchData]);

  return (
    <div className="canada-bg text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* 1 — Hero */}
        <HeroSection />

        {/* Returning-visitor nudge */}
        <QuickStartPrompt />

        {/* 2 — Choose your path */}
        <ChooseYourPath />

        {/* 3 — At-a-glance live data */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Latest draw */}
            <a
              href="/draws"
              className="canada-card p-4 transition-colors hover:border-yellow-500/40"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🗳</span>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Latest Express Entry Draw</p>
              </div>
              <p className="text-2xl font-bold text-white mt-1 leading-none">
                {latestCRS !== null ? `CRS ${latestCRS}` : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestDrawDate
                  ? new Date(latestDrawDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
                  : "Loading…"}
                {" · View all draws →"}
              </p>
            </a>

            {/* Latest news */}
            <a
              href="/news"
              className="canada-card p-4 transition-colors hover:border-blue-500/40"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📰</span>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Latest IRCC News</p>
              </div>
              <p className="text-sm font-semibold text-white mt-1 line-clamp-2 leading-snug">
                {latestNews?.title ?? "Loading…"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestNews ? timeAgo(latestNews.published_at) + " · " : ""}All IRCC news →
              </p>
            </a>

            {/* Processing freshness */}
            <a
              href="/processing"
              className="canada-card p-4 transition-colors hover:border-green-500/40"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">⏱</span>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Processing Times</p>
              </div>
              <p className="text-2xl font-bold text-white mt-1 leading-none">180+ countries</p>
              <p className="text-xs text-gray-500 mt-1">
                {processingFreshness
                  ? "Updated " + timeAgo(processingFreshness)
                  : "Loading…"}
                {" · Check yours →"}
              </p>
            </a>
          </div>
        </section>

        {/* 4 — All tools, grouped */}
        <ToolsByGroup />

        {/* 5 — Closing CTA */}
        <section className="canada-card p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
            Free, independent, built by an immigrant
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            We pull directly from canada.ca and present it in tools anyone can use in under a minute.
            Not affiliated with IRCC.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
            <a
              href="/about"
              className="canada-pill px-5 py-2 text-sm"
              style={{ textDecoration: "none" }}
            >
              About IRCC Tracker
            </a>
            <a
              href="https://www.instagram.com/ircc_tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="canada-pill px-5 py-2 text-sm"
              style={{ textDecoration: "none" }}
            >
              📸 Follow @ircc_tracker
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
