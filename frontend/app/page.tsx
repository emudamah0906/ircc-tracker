"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, ProcessingTime } from "@/lib/supabase";
import { getFlagEmoji } from "@/lib/countries";
import TrendChart from "@/components/TrendChart";
import AlertSignup from "@/components/AlertSignup";
import Header from "@/components/Header";

// location: "outside" = applying from abroad | "inside" = already in Canada | "both" = applies to both
const VISA_TYPES = [
  { key: "all", label: "All Types", location: "both" },
  { key: "visitor-outside-canada", label: "Visitor Visa (TRV)", location: "outside" },
  { key: "work", label: "Work Permit", location: "both" },
  { key: "study", label: "Study Permit", location: "both" },
  { key: "supervisa", label: "Super Visa", location: "outside" },
  { key: "child_dependent", label: "Dependent Child", location: "both" },
  { key: "child_adopted", label: "Adopted Child", location: "both" },
  { key: "refugees_gov", label: "Gov. Refugee", location: "both" },
  { key: "refugees_private", label: "Private Refugee", location: "both" },
];

const LOCATION_CONFIG = {
  outside: {
    icon: "✈️",
    label: "Applying from Outside Canada",
    sublabel: "Visitor visa, work/study permit, super visa",
    tip: "Processing times shown are for applications submitted from your home country to a Canadian visa office.",
    relevantVisas: ["visitor-outside-canada", "work", "study", "supervisa", "child_dependent", "child_adopted", "refugees_gov", "refugees_private"],
  },
  inside: {
    icon: "🇨🇦",
    label: "Already in Canada",
    sublabel: "Extensions, renewals, PR, citizenship",
    tip: "Processing times for applications submitted inside Canada. This includes permit extensions, renewals, and PR applications.",
    relevantVisas: ["work", "study", "child_dependent", "child_adopted", "refugees_gov", "refugees_private"],
  },
};

const POPULAR_COUNTRIES = [
  { code: "IND", name: "India" },
  { code: "PHL", name: "Philippines" },
  { code: "CHN", name: "China" },
  { code: "NGA", name: "Nigeria" },
  { code: "MEX", name: "Mexico" },
  { code: "PAK", name: "Pakistan" },
  { code: "GBR", name: "UK" },
  { code: "USA", name: "USA" },
];

export default function Home() {
  const [data, setData] = useState<ProcessingTime[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("IND");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedVisa, setSelectedVisa] = useState("all");
  const [sortBy, setSortBy] = useState<"alpha" | "fastest" | "slowest">("alpha");
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [latestCRS, setLatestCRS] = useState<number | null>(null);
  const [latestDrawDate, setLatestDrawDate] = useState<string | null>(null);
  const [location, setLocation] = useState<"outside" | "inside">("outside");

  const PAGE_SIZE = 20;

  useEffect(() => {
    async function fetchData() {
      const [{ data: rows }, { data: draws }] = await Promise.all([
        supabase.from("latest_processing_times").select("*"),
        supabase.from("pr_draws").select("crs_score, draw_date").is("province", null).order("draw_date", { ascending: false }).limit(1),
      ]);
      setData(rows || []);
      if (rows?.length) setLastUpdated(rows[0].fetched_at);
      if (draws?.length) {
        setLatestCRS(draws[0].crs_score);
        setLatestDrawDate(draws[0].draw_date);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const allCountries = [...new Map(data.map(r => [r.country_code, { code: r.country_code, name: r.country_name }])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredCountries = countrySearch.trim()
    ? allCountries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : allCountries;

  const selectedCountryName = allCountries.find(c => c.code === selectedCountry)?.name || selectedCountry;

  const locationVisas = LOCATION_CONFIG[location].relevantVisas;
  const visibleVisaTypes = VISA_TYPES.filter(v => v.key === "all" || locationVisas.includes(v.key));

  const countryCards = data
    .filter(r => r.country_code === selectedCountry)
    .filter(r => locationVisas.includes(r.visa_type))
    .filter(r => selectedVisa === "all" || r.visa_type === selectedVisa);

  // Build grouped table: group by country, filter by visa + search, sort
  type CountryGroup = { code: string; name: string; rows: ProcessingTime[] };

  let filteredRows = data.filter(r => locationVisas.includes(r.visa_type));
  if (selectedVisa !== "all") filteredRows = filteredRows.filter(r => r.visa_type === selectedVisa);

  // Group by country
  const groupMap = new Map<string, CountryGroup>();
  for (const row of filteredRows) {
    if (!groupMap.has(row.country_code)) {
      groupMap.set(row.country_code, { code: row.country_code, name: row.country_name, rows: [] });
    }
    groupMap.get(row.country_code)!.rows.push(row);
  }
  let countryGroups = Array.from(groupMap.values());

  // Search filter on country name
  if (tableSearch.trim()) {
    const q = tableSearch.toLowerCase();
    countryGroups = countryGroups.filter(g =>
      g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q)
    );
  }

  // Sort country groups
  if (sortBy === "alpha") {
    countryGroups.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "fastest") {
    countryGroups.sort((a, b) => Math.min(...a.rows.map(r => r.processing_weeks)) - Math.min(...b.rows.map(r => r.processing_weeks)));
  } else {
    countryGroups.sort((a, b) => Math.max(...b.rows.map(r => r.processing_weeks)) - Math.max(...a.rows.map(r => r.processing_weeks)));
  }

  const totalPages = Math.ceil(countryGroups.length / PAGE_SIZE);
  const paginatedGroups = countryGroups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const uniqueCountries = allCountries.length;
  const uniqueVisaTypes = [...new Set(data.map(r => r.visa_type))].length;

  function selectCountry(code: string) {
    setSelectedCountry(code);
    setCountrySearch("");
    setShowCountryDropdown(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#country-dropdown-root")) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="canada-bg text-white">
      <Header activeNav="processing" lastUpdated={lastUpdated} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {loading ? (
          <div className="text-center py-32 text-gray-500">Loading processing times...</div>
        ) : (
          <>
            {/* ── STATS BAR ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Countries Tracked", value: uniqueCountries, icon: "🌍" },
                { label: "Visa Types", value: uniqueVisaTypes, icon: "📋" },
                { label: "Updated", value: "Daily", icon: "🔄" },
                { label: "Latest CRS Cut-off", value: latestCRS ?? "—", icon: "🏆", href: "/draws" },
              ].map((stat) => (
                <a
                  key={stat.label}
                  href={stat.href || undefined}
                  className="canada-card p-4 text-center block"
                  style={{ textDecoration: "none", cursor: stat.href ? "pointer" : "default" }}
                >
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </a>
              ))}
            </div>

            {/* ── LATEST DRAW TEASER ── */}
            {latestCRS && latestDrawDate && (
              <a href="/draws" style={{ textDecoration: "none" }}>
                <div className="canada-card px-5 py-4 flex items-center justify-between gap-4 hover:border-red-500/40 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🗳</span>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Latest Express Entry Draw</p>
                      <p className="text-white font-semibold text-sm mt-0.5">
                        CRS Cut-off: <span className="text-yellow-400 text-lg font-bold">{latestCRS}</span>
                        <span className="text-gray-400 font-normal ml-3">
                          · {new Date(latestDrawDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm whitespace-nowrap">View all draws →</span>
                </div>
              </a>
            )}

            {/* ── HERO: Country Selector ── */}
            <section className="canada-card p-8 text-center">

              {/* Location toggle */}
              <div className="flex justify-center mb-6">
                <div className="flex rounded-xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                  {(["outside", "inside"] as const).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setLocation(loc); setSelectedVisa("all"); setCurrentPage(1); }}
                      style={{
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        background: location === loc ? "linear-gradient(135deg, #d52b1e, #a01208)" : "transparent",
                        color: location === loc ? "white" : "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{LOCATION_CONFIG[loc].icon}</span>
                      <span className="hidden sm:inline">{loc === "outside" ? "Outside Canada" : "Inside Canada"}</span>
                      <span className="sm:hidden">{loc === "outside" ? "Abroad" : "In Canada"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-1">{LOCATION_CONFIG[location].label}</h2>
              <p className="text-gray-400 mb-2 text-sm">{LOCATION_CONFIG[location].sublabel}</p>
              <p className="text-xs text-gray-500 mb-6 max-w-lg mx-auto">{LOCATION_CONFIG[location].tip}</p>

              {/* Popular country quick-picks */}
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {POPULAR_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => selectCountry(c.code)}
                    className={`canada-pill ${selectedCountry === c.code ? "active" : ""}`}
                    style={{ fontSize: "12px", padding: "5px 14px" }}
                  >
                    {getFlagEmoji(c.code)} {c.name}
                  </button>
                ))}
              </div>

              {/* Country search dropdown */}
              <div id="country-dropdown-root" className="relative max-w-md mx-auto" style={{ zIndex: 200 }}>
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
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden"
                    style={{ background: "#0d1b35", maxHeight: "300px", overflowY: "auto", zIndex: 300 }}>
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
                        onClick={() => selectCountry(c.code)}
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

            {/* ── INSIDE CANADA: extra info banner ── */}
            {location === "inside" && (
              <div className="canada-card p-5 border-blue-700/30" style={{ borderColor: "rgba(59,130,246,0.25)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Applying from inside Canada?</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      If you are already in Canada, you can extend or change your status (work permit, study permit, visitor record) before it expires.
                      You can also apply for PR through Express Entry, PNP, or spousal sponsorship.
                      The processing times shown below apply to <strong className="text-white">inside-Canada applications</strong>.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href="/crs" className="canada-pill" style={{ fontSize: "11px", padding: "3px 12px" }}>🧮 Check your CRS Score</a>
                      <a href="/draws" className="canada-pill" style={{ fontSize: "11px", padding: "3px 12px" }}>🗳 Latest PR Draws</a>
                      <a href="/dashboard" className="canada-pill" style={{ fontSize: "11px", padding: "3px 12px" }}>📊 My PR Dashboard</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SELECTED COUNTRY: Visa Cards ── */}
            {countryCards.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="section-title mb-0">
                    {getFlagEmoji(selectedCountry)} {selectedCountryName} — Processing Times
                  </h2>
                  {/* Visa type filters — scoped to location */}
                  <div className="flex flex-wrap gap-2">
                    {visibleVisaTypes.map((v) => (
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
            ) : (
              <div className="canada-card p-8 text-center text-gray-500 text-sm">
                No processing time data available for {selectedCountryName} yet.
              </div>
            )}

            {/* ── TREND CHART ── only show if country has cards */}
            {countryCards.length > 0 && (
              <section className="canada-card p-6">
                <h2 className="section-title mb-1">
                  📈 Processing Time Trend — {getFlagEmoji(selectedCountry)} {selectedCountryName}
                </h2>
                <p className="text-xs text-gray-500 mb-4">Historical data builds up over time as the scraper runs daily</p>
                <TrendChart countryCode={selectedCountry} visaType={selectedVisa} />
              </section>
            )}

            {/* ── ALL COUNTRIES TABLE ── */}
            <section>
              {/* Header row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <h2 className="section-title mb-0">
                  🌍 All Countries
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({countryGroups.length} {countryGroups.length === 1 ? "country" : "countries"})
                  </span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedVisa}
                    onChange={(e) => { setSelectedVisa(e.target.value); setCurrentPage(1); }}
                    className="canada-input py-1.5 text-xs w-40"
                  >
                    {visibleVisaTypes.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
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

              {/* Search bar */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search by country name..."
                  value={tableSearch}
                  onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                  className="canada-input py-2.5 text-sm pl-9"
                />
                {tableSearch && (
                  <button
                    onClick={() => { setTableSearch(""); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none"
                  >×</button>
                )}
              </div>

              <div className="canada-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">#</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-left">Visa Type</th>
                      <th className="px-4 py-3 text-right">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGroups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500 text-sm">
                          No countries found matching &ldquo;{tableSearch}&rdquo;
                        </td>
                      </tr>
                    )}
                    {paginatedGroups.map((group, gi) => (
                      group.rows.map((row, ri) => (
                        <tr
                          key={`${group.code}-${row.visa_type}`}
                          className={`transition-colors cursor-pointer ${
                            group.code === selectedCountry ? "bg-red-900/10" : ri % 2 === 0 ? "" : "bg-white/[0.01]"
                          } ${ri === 0 ? "border-t border-white/10" : "border-t border-white/5"}`}
                          onClick={() => { setSelectedCountry(group.code); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        >
                          {/* # and Country only on first row of group */}
                          {ri === 0 ? (
                            <>
                              <td className="px-4 py-3 text-gray-500 text-xs align-top pt-4" rowSpan={group.rows.length}>
                                {(currentPage - 1) * PAGE_SIZE + gi + 1}
                              </td>
                              <td className="px-4 py-3 align-top pt-4 font-semibold text-gray-100" rowSpan={group.rows.length}>
                                <span className="text-lg mr-2">{getFlagEmoji(group.code)}</span>
                                {group.name || group.code}
                              </td>
                            </>
                          ) : null}
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{row.visa_label}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.processing_weeks <= 30 ? "bg-green-900/60 text-green-300"
                              : row.processing_weeks <= 90 ? "bg-yellow-900/60 text-yellow-300"
                              : "bg-red-900/60 text-red-300"
                            }`}>
                              {row.processing_weeks} {row.unit}
                            </span>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination — country-based */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages} · showing countries {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, countryGroups.length)} of {countryGroups.length}
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

            {/* ── ALERT SIGNUP — bottom ── */}
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
