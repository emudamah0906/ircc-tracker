"use client";

import { useEffect, useState } from "react";
import { supabase, ProcessingTime } from "@/lib/supabase";
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

      if (error) {
        console.error(error);
        return;
      }
      setData(rows || []);
      if (rows?.length) setLastUpdated(rows[0].fetched_at);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;
    if (selectedVisa !== "all") {
      result = result.filter((r) => r.visa_type === selectedVisa);
    }
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.country_name.toLowerCase().includes(q) ||
          r.country_code.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [data, selectedVisa, countrySearch]);

  const indiaRows = filtered.filter((r) => r.country_code === "IND");
  const allCountries = [...new Set(data.map((r) => r.country_code))].sort();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🍁 IRCC Processing Times
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Canada immigration wait times — updated daily
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
          <span className="text-xs text-gray-500">
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleDateString("en-CA", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Visa filter pills */}
        <div className="flex flex-wrap gap-2">
          {VISA_TYPES.map((v) => (
            <button
              key={v.key}
              onClick={() => setSelectedVisa(v.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedVisa === v.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading processing times...
          </div>
        ) : (
          <>
            {/* India Spotlight */}
            {indiaRows.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 text-orange-400">
                  🇮🇳 India Processing Times
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indiaRows.map((row) => (
                    <div
                      key={row.visa_type}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                    >
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        {row.visa_label}
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {row.processing_weeks}
                        <span className="text-base font-normal text-gray-400 ml-1">
                          {row.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trend Chart */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Processing Time Trend</h2>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-sm rounded px-2 py-1 text-white"
                >
                  {allCountries.map((c) => (
                    <option key={c} value={c}>
                      {data.find((r) => r.country_code === c)?.country_name || c}
                    </option>
                  ))}
                </select>
              </div>
              <TrendChart countryCode={selectedCountry} visaType={selectedVisa} />
            </section>

            {/* Full Table */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">All Processing Times</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 w-48"
                  />
                  <svg className="absolute left-2.5 top-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Visa Type</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-right">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filtered.map((row, i) => (
                      <tr key={i} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                        <td className="px-4 py-3">{row.visa_label}</td>
                        <td className="px-4 py-3 text-gray-300">{row.country_name}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.processing_weeks <= 4
                                ? "bg-green-900 text-green-300"
                                : row.processing_weeks <= 12
                                ? "bg-yellow-900 text-yellow-300"
                                : "bg-red-900 text-red-300"
                            }`}
                          >
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
    </div>
  );
}
