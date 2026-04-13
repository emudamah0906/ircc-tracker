"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

type Draw = {
  id: number;
  draw_number: number;
  draw_date: string;
  draw_type: string;
  province: string | null;
  program: string;
  invitations: number;
  crs_score: number | null;
};

const PROVINCES = [
  { key: "all", label: "All Draws" },
  { key: "federal", label: "Express Entry (Federal)" },
  { key: "Ontario", label: "Ontario (OINP)" },
  { key: "British Columbia", label: "British Columbia (BC PNP)" },
  { key: "Alberta", label: "Alberta (AAIP)" },
  { key: "Saskatchewan", label: "Saskatchewan (SINP)" },
  { key: "Manitoba", label: "Manitoba (MPNP)" },
  { key: "Nova Scotia", label: "Nova Scotia (NSNP)" },
  { key: "New Brunswick", label: "New Brunswick (NBPNP)" },
  { key: "Prince Edward Island", label: "PEI (PEI PNP)" },
  { key: "Newfoundland", label: "Newfoundland (NLPNP)" },
];

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [filtered, setFiltered] = useState<Draw[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function fetchDraws() {
      const { data, error } = await supabase
        .from("pr_draws")
        .select("*")
        .order("draw_date", { ascending: false })
        .limit(100);

      if (error) return;
      setDraws(data || []);
      setLoading(false);
    }
    fetchDraws();
  }, []);

  useEffect(() => {
    let result = draws;
    if (selectedProvince === "federal") {
      result = draws.filter((d) => d.province === null);
    } else if (selectedProvince !== "all") {
      result = draws.filter((d) => d.province === selectedProvince);
    }
    setFiltered(result);
  }, [draws, selectedProvince]);

  async function subscribeDrawAlerts(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await supabase.from("alert_subscriptions").insert({
      email,
      visa_type: "pr_draw",
      country_code: "CAN",
    });
    setSubscribed(true);
    setEmail("");
  }

  const latestDraw = draws.find((d) => d.province === null);
  const latestCRS = latestDraw?.crs_score;
  const previousDraw = draws.filter((d) => d.province === null)[1];
  const crsChange = latestCRS && previousDraw?.crs_score
    ? latestCRS - previousDraw.crs_score
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header subtitle="PR Draws — Express Entry & Provincial" activeNav="draws" />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Next Draw Countdown */}
        {latestDraw && (() => {
          const latestDate = new Date(latestDraw.draw_date);
          const nextExpected = new Date(latestDate);
          nextExpected.setDate(nextExpected.getDate() + 14);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          nextExpected.setHours(0, 0, 0, 0);
          const diffMs = nextExpected.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const isOverdue = daysRemaining <= 0;
          return (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              border: '1px solid #374151',
              borderLeft: '4px solid #dc2626',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: '2rem' }}>🍁</div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  Next Federal Draw
                </p>
                {isOverdue ? (
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', margin: '4px 0 0' }}>
                    Draw expected any day now!
                  </p>
                ) : (
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: '4px 0 0' }}>
                    Expected in{' '}
                    <span style={{ color: '#dc2626', fontSize: '1.75rem' }}>{daysRemaining}</span>
                    {' '}{daysRemaining === 1 ? 'day' : 'days'}
                  </p>
                )}
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
                  Based on 14-day draw cycle · Last draw{' '}
                  {latestDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          );
        })()}

        {/* CRS Stats */}
        {latestDraw && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Latest CRS Cut-off</p>
              <p className="text-4xl font-bold mt-1 text-white">{latestCRS}</p>
              <p className="text-xs text-gray-500 mt-1">{latestDraw.program}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">CRS Change</p>
              <p className={`text-4xl font-bold mt-1 ${crsChange === null ? "text-gray-400" : crsChange <= 0 ? "text-green-400" : "text-red-400"}`}>
                {crsChange === null ? "—" : crsChange > 0 ? `+${crsChange}` : crsChange}
              </p>
              <p className="text-xs text-gray-500 mt-1">vs previous draw</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Latest Draw Date</p>
              <p className="text-2xl font-bold mt-1">
                {new Date(latestDraw.draw_date).toLocaleDateString("en-CA", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">{latestDraw.invitations.toLocaleString()} invitations</p>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {PROVINCES.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedProvince(p.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedProvince === p.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Draws Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading draws...</div>
        ) : (
          <section>
            <h2 className="text-lg font-semibold mb-3">
              {selectedProvince === "all" ? "All Recent Draws" :
               PROVINCES.find(p => p.key === selectedProvince)?.label}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Draw Type</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-right">Invitations</th>
                    <th className="px-4 py-3 text-right">CRS Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((draw) => (
                    <tr key={draw.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                      <td className="px-4 py-3 text-gray-300">
                        {new Date(draw.draw_date).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          draw.province === null
                            ? "bg-red-900 text-red-300"
                            : "bg-blue-900 text-blue-300"
                        }`}>
                          {draw.province === null ? "Federal" : draw.province}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{draw.program}</td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {draw.invitations.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {draw.crs_score ? (
                          <span className="text-yellow-400 font-bold">{draw.crs_score}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No draws found for this province yet. Check back soon!
              </p>
            )}
          </section>
        )}

        {/* Alert Signup */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Get Notified on New Draws — Free</h2>
          <p className="text-sm text-gray-400 mb-4">
            We&apos;ll email you instantly when a new Express Entry or PNP draw is announced.
          </p>
          {subscribed ? (
            <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
              You&apos;re subscribed! We&apos;ll notify you at <strong>{email || "your email"}</strong> on every new draw.
            </div>
          ) : (
            <form onSubmit={subscribeDrawAlerts} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Notify Me on New Draws
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
