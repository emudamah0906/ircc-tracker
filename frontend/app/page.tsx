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
  const [selectedCountry, setSelectedCountry] = useState("IND");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedVisa, setSelectedVisa] = useState("all");
  const [sortBy, setSortBy] = useState<"alpha" | "fastest" | "slowest">("alpha");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

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

  // All unique countries sorted alphabetically
  const allCountries = [...new Map(data.map(r => [r.country_code, { code: r.country_code, name: r.country_name }])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filtered countries for search dropdown
  const filteredCountries = countrySearch.trim()
    ? allCountries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : allCountries;

  // Selected country info
  const selectedCountryName = allCountries.find(c => c.code === selectedCountry)?.name || selectedCountry;

  // Cards for selected country
  const countryCards = data
    .filter(r => r.country_code === selectedCountry)
    .filter(r => selectedVisa === "all" || r.visa_type === selectedVisa);

  // Full table (all countries)
  let tableData = data;
  if (selectedVisa !== "all") tableData = tableData.filter(r => r.visa_type === selectedVisa);
  if (sortBy === "alpha") tableData = [...tableData].sort((a, b) => a.country_name.localeCompare(b.country_name));
  else if (sortBy === "fastest") tableData = [...tableData].sort((a, b) => a.processing_weeks - b.processing_weeks);
  else tableData = [...tableData].sort((a, b) => b.processing_weeks - a.processing_weeks);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const paginated = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="canada-bg text-white">
      {/* Header */}
      <header className="canada-header px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🍁 IRCC Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">Canada immigration wait times — updated daily</p>
        </div>
        <nav className="flex items-center gap-2">
          <a href="/draws" className="canada-pill">🗳 PR Draws</a>
          <a href="/crs" className="canada-pill">🧮 CRS Score</a>
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden md:block ml-2">
              Updated: {new Date(lastUpdated).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8" style={{ position: "relative", zIndex: 1 }}>

        {loading ? (
          <div className="text-center py-32 text-gray-500">Loading processing times...</div>
        ) : (
          <>
            {/* ── HERO: Country Selector ── */}
            <section className="canada-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Check Processing Times For Your Country</h2>
              <p className="text-gray-400 mb-6 text-sm">Select your country to instantly see all visa wait times and trends</p>

              {/* Country search input */}
              <div className="relative max-w-md mx-auto">
                <div
                  className="canada-input flex items-center gap-3 cursor-pointer py-3 px-4"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span className="text-2xl">{getFlagEmoji(selectedCountry)}</span>
                  <span className="flex-1 text-left font-medium">{selectedCountryName}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showCountryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden z-50"
                    style={{ background: "#0d1b35", maxHeight: "300px", overflowY: "auto" }}>
                    <div className="p-2 sticky top-0" style={{ background: "#0d1b35" }}>
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="canada-input py-2 text-sm"
                      />
                    </div>
                    {filteredCountries.map((c) => (
                      <div
                        key={c.code}
                        onClick={() => {
                          setSelectedCountry(c.code);
                          setCountrySearch("");
                          setShowCountryDropdown(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 text-sm ${selectedCountry === c.code ? "bg-red-900/30 text-white" : "text-gray-300"}`}
                      >
                        <span className="text-lg">{getFlagEmoji(c.code)}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-sm">No countries found</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── SELECTED COUNTRY: Visa Cards ── */}
            {countryCards.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title mb-0">
                    {getFlagEmoji(selectedCountry)} {selectedCountryName} — Processing Times
                  </h2>
                  {/* Visa type filter */}
                  <div className="flex flex-wrap gap-2">
                    {VISA_TYPES.slice(0, 5).map((v) => (
                      <button
                        key={v.key}
                        onClick={() => setSelectedVisa(v.key)}
                        className={`canada-pill ${selectedVisa === v.key ? "active" : ""}`}
                        style={{ fontSize: "11px", padding: "4px 12px" }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {countryCards.map((row) => (
                    <div key={row.visa_type} className="stat-card">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{row.visa_label}</p>
                      <p className="text-3xl font-bold mt-2 text-white">
                        {row.processing_weeks}
                        <span className="text-sm font-normal text-gray-400 ml-1">{row.unit}</span>
                      </p>
                      <div className={`mt-2 text-xs font-semibold ${
                        row.processing_weeks <= 30 ? "text-green-400" :
                        row.processing_weeks <= 90 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {row.processing_weeks <= 30 ? "✓ Fast" : row.processing_weeks <= 90 ? "⚠ Moderate" : "✕ Slow"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── TREND CHART for selected country ── */}
            <section className="canada-card p-6">
              <h2 className="section-title mb-4">
                📈 Processing Time Trend — {getFlagEmoji(selectedCountry)} {selectedCountryName}
              </h2>
              <TrendChart countryCode={selectedCountry} visaType={selectedVisa} />
            </section>

            {/* ── ALL COUNTRIES TABLE ── */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <h2 className="section-title mb-0">
                  🌍 All Countries
                  <span className="text-sm font-normal text-gray-500 ml-2">({tableData.length} results)</span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedVisa}
                    onChange={(e) => { setSelectedVisa(e.target.value); setCurrentPage(1); }}
                    className="canada-input py-1.5 text-xs w-36"
                  >
                    {VISA_TYPES.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value as "alpha" | "fastest" | "slowest"); setCurrentPage(1); }}
                    className="canada-input py-1.5 text-xs w-36"
                  >
                    <option value="alpha">A → Z Country</option>
                    <option value="fastest">Fastest First</option>
                    <option value="slowest">Slowest First</option>
                  </select>
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
                      <tr
                        key={i}
                        className={`transition-colors cursor-pointer ${row.country_code === selectedCountry ? "bg-red-900/10" : ""}`}
                        onClick={() => { setSelectedCountry(row.country_code); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      >
                        <td className="px-4 py-3 text-gray-600 text-xs">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3 text-gray-200 font-medium">
                          <span className="mr-2">{getFlagEmoji(row.country_code)}</span>
                          {row.country_name || row.country_code}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{row.visa_label}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            row.processing_weeks <= 30 ? "bg-green-900/60 text-green-300"
                            : row.processing_weeks <= 90 ? "bg-yellow-900/60 text-yellow-300"
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
                    Page {currentPage} of {totalPages} · {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, tableData.length)} of {tableData.length}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300">«</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300">Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-xs rounded ${currentPage === page ? "bg-red-600 text-white font-bold" : "bg-white/5 hover:bg-white/10 text-gray-300"}`}>
                          {page}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300">Next</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300">»</button>
                  </div>
                </div>
              )}
            </section>

            {/* Alert Signup */}
            <AlertSignup
              visaTypes={VISA_TYPES.slice(1)}
              countries={allCountries}
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
