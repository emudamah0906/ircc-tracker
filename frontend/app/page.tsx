"use client";

import { useEffect, useState } from "react";
import { supabase, ProcessingTime } from "@/lib/supabase";
import { getFlagEmoji } from "@/lib/countries";
import TrendChart from "@/components/TrendChart";
import AlertSignup from "@/components/AlertSignup";

const VISA_TYPES = [
  { key: "all", label: "All Types" },
  { key: "visitor-outside-canada", label: "Visitor Visa" },
  { key: "work", label: "Work Permit" },
  { key: "study", label: "Study Permit" },
  { key: "supervisa", label: "Super Visa" },
  { key: "child_dependent", label: "Dependent Child" },
  { key: "child_adopted", label: "Adopted Child" },
  { key: "refugees_gov", label: "Gov. Refugee" },
  { key: "refugees_private", label: "Private Refugee" },
];

export default function Home() {
  const [data, setData] = useState<ProcessingTime[]>([]);
  const [filtered, setFiltered] = useState<ProcessingTime[]>([]);
  const [selectedVisa, setSelectedVisa] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("IND");
  const [countrySearch, setCountrySearch] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "fastest" | "slowest">("alpha");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function fetchData() {
      const { data: rows, error } = await supabase
        .from("latest_processing_times")
        .select("*");

      if (error) { console.error(error); return; }
      setData(rows || []);
      if (rows?.length) setLastUpdated(rows[0].fetched_at);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (selectedVisa !== "all") result = result.filter((r) => r.visa_type === selectedVisa);
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      result = result.filter(
        (r) => r.country_name.toLowerCase().includes(q) || r.country_code.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === "alpha") {
      result = [...result].sort((a, b) => a.country_name.localeCompare(b.country_name));
    } else if (sortBy === "fastest") {
      result = [...result].sort((a, b) => a.processing_weeks - b.processing_weeks);
    } else {
      result = [...result].sort((a, b) => b.processing_weeks - a.processing_weeks);
    }
    setFiltered(result);
    setCurrentPage(1); // reset to page 1 on filter change
  }, [data, selectedVisa, countrySearch, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const indiaRows = data.filter((r) => r.country_code === "IND");
  const allCountries = [...new Set(data.map((r) => r.country_code))].sort();

  return (
    <div className="canada-bg text-white">
      {/* Header */}
      <header className="canada-header px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🍁 IRCC Processing Times</h1>
          <p className="text-sm text-gray-400 mt-0.5">Canada immigration wait times — updated daily</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/draws" className="canada-btn text-sm">🗳 PR Draws</a>
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8" style={{ position: "relative", zIndex: 1 }}>

        {/* Visa filter pills */}
        <div className="flex flex-wrap gap-2">
          {VISA_TYPES.map((v) => (
            <button
              key={v.key}
              onClick={() => setSelectedVisa(v.key)}
              className={`canada-pill ${selectedVisa === v.key ? "active" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading processing times...</div>
        ) : (
          <>
            {/* India Spotlight */}
            {indiaRows.length > 0 && (
              <section>
                <h2 className="section-title">🇮🇳 India Processing Times</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {indiaRows.map((row) => (
                    <div key={row.visa_type} className="stat-card">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{row.visa_label}</p>
                      <p className="text-3xl font-bold mt-2 text-white">
                        {row.processing_weeks}
                        <span className="text-sm font-normal text-gray-400 ml-1">{row.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trend Chart */}
            <section className="canada-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">📈 Processing Time Trend</h2>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="canada-input w-48 py-1.5"
                >
                  {allCountries.map((c) => (
                    <option key={c} value={c}>
                      {getFlagEmoji(c)} {data.find((r) => r.country_code === c)?.country_name || c}
                    </option>
                  ))}
                </select>
              </div>
              <TrendChart countryCode={selectedCountry} visaType={selectedVisa} />
            </section>

            {/* Full Table */}
            <section>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <h2 className="section-title mb-0">
                  🌍 All Processing Times
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filtered.length} results)
                  </span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "alpha" | "fastest" | "slowest")}
                    className="canada-input py-1.5 text-xs w-36"
                  >
                    <option value="alpha">A → Z Country</option>
                    <option value="fastest">Fastest First</option>
                    <option value="slowest">Slowest First</option>
                  </select>
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="canada-input pl-8 py-1.5 w-44"
                    />
                    <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="canada-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-left">Visa Type</th>
                      <th className="px-4 py-3 text-right">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginated.map((row, i) => (
                      <tr key={i} className="transition-colors">
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {(currentPage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3 text-gray-200 font-medium">
                          <span className="mr-2">{getFlagEmoji(row.country_code)}</span>
                          {row.country_name || row.country_code}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{row.visa_label}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            row.processing_weeks <= 30
                              ? "bg-green-900/60 text-green-300"
                              : row.processing_weeks <= 90
                              ? "bg-yellow-900/60 text-yellow-300"
                              : "bg-red-900/60 text-red-300"
                          }`}>
                            {row.processing_weeks} {row.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} · Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >«</button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-xs rounded ${
                            currentPage === page
                              ? "bg-red-600 text-white font-bold"
                              : "bg-white/5 hover:bg-white/10 text-gray-300"
                          }`}
                        >{page}</button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >Next</button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300"
                    >»</button>
                  </div>
                </div>
              )}
            </section>

            {/* Alert Signup */}
            <AlertSignup
              visaTypes={VISA_TYPES.slice(1)}
              countries={allCountries.map((c) => ({
                code: c,
                name: data.find((r) => r.country_code === c)?.country_name || c,
              }))}
            />
          </>
        )}
      </main>

      <footer className="text-center py-6 text-gray-600 text-xs" style={{ position: "relative", zIndex: 1 }}>
        🍁 ircctracker.org — Not affiliated with IRCC or the Government of Canada
      </footer>
    </div>
  );
}
