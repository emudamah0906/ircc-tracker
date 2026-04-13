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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: rows, error } = await supabase
        .from("latest_processing_times")
        .select("*")
        .order("processing_weeks", { ascending: true });

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
    setFiltered(result);
  }, [data, selectedVisa, countrySearch]);

  const indiaRows = filtered.filter((r) => r.country_code === "IND");
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
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title mb-0">🌍 All Processing Times</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="canada-input pl-8 py-1.5 w-48"
                  />
                  <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </div>
              </div>
              <div className="canada-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Visa Type</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-right">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((row, i) => (
                      <tr key={i} className="transition-colors">
                        <td className="px-4 py-3 text-gray-200">{row.visa_label}</td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="mr-2">{getFlagEmoji(row.country_code)}</span>
                          {row.country_name || row.country_code}
                        </td>
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
