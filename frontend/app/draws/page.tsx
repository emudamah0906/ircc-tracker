"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

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
    <PageLayout subtitle="PR Draws — Express Entry & Provincial" activeNav="draws">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold">🗳 PR Draws</h1>
        <p className="text-gray-400 text-sm mt-1">Express Entry & Provincial Nominee Program draw results</p>
      </div>

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
          <div className="canada-card p-5 flex items-center gap-5 flex-wrap"
            style={{ borderLeft: "4px solid #d52b1e" }}>
            <div style={{ fontSize: '2rem' }}>🍁</div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Next Federal Draw</p>
              {isOverdue ? (
                <p className="text-xl font-bold text-red-400 mt-1">Draw expected any day now!</p>
              ) : (
                <p className="text-xl font-bold text-white mt-1">
                  Expected in{' '}
                  <span className="text-red-500 text-3xl">{daysRemaining}</span>
                  {' '}{daysRemaining === 1 ? 'day' : 'days'}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
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
          <div className="stat-card">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Latest CRS Cut-off</p>
            <p className="text-4xl font-bold mt-1 text-white">{latestCRS}</p>
            <p className="text-xs text-gray-500 mt-1">{latestDraw.program}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-400 uppercase tracking-wide">CRS Change</p>
            <p className={`text-4xl font-bold mt-1 ${crsChange === null ? "text-gray-400" : crsChange <= 0 ? "text-green-400" : "text-red-400"}`}>
              {crsChange === null ? "—" : crsChange > 0 ? `+${crsChange}` : crsChange}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs previous draw</p>
          </div>
          <div className="stat-card">
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

      {/* Cross-tool: CRS Calculator link */}
      <a href="/crs" className="canada-next-step" style={{ textDecoration: "none", cursor: "pointer" }}>
        <span className="text-2xl">🧮</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Want to know your CRS score?</p>
          <p className="text-xs text-gray-400 mt-0.5">Use our calculator to see if you meet the latest cut-off</p>
        </div>
        <span className="text-gray-400 text-sm whitespace-nowrap">Calculate CRS →</span>
      </a>

      {/* CRS Trend Chart */}
      {draws.filter(d => d.province === null && d.crs_score).length >= 2 && (() => {
        const federalDraws = draws
          .filter(d => d.province === null && d.crs_score)
          .slice(0, 20)
          .reverse();
        const chartData = federalDraws.map(d => ({
          date: new Date(d.draw_date).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
          crs: d.crs_score,
          invitations: d.invitations,
        }));
        const scores = federalDraws.map(d => d.crs_score as number);
        const minScore = Math.min(...scores) - 10;
        const maxScore = Math.max(...scores) + 10;
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return (
          <div className="canada-card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold">📈 CRS Cut-off Trend</h2>
              <span className="text-xs text-gray-500">Last {federalDraws.length} federal draws</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Average cut-off: <span className="text-yellow-400 font-semibold">{avg}</span>
              {scores[scores.length - 1] > avg
                ? <span className="text-red-400 ml-2">↑ Currently above average</span>
                : <span className="text-green-400 ml-2">↓ Currently below average</span>}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis domain={[minScore, maxScore]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d1b35", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb", fontSize: 12, borderRadius: "8px" }}
                  formatter={(val, name) =>
                    name === "crs" ? [val, "CRS Cut-off"] : [Number(val).toLocaleString(), "Invitations"]
                  }
                />
                <ReferenceLine y={avg} stroke="#6b7280" strokeDasharray="4 4"
                  label={{ value: `Avg ${avg}`, fill: "#6b7280", fontSize: 10, position: "insideTopRight" }} />
                <Line
                  type="monotone" dataKey="crs" stroke="#eab308"
                  strokeWidth={2.5} dot={{ fill: "#eab308", r: 3 }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {PROVINCES.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelectedProvince(p.key)}
            className={`canada-pill ${selectedProvince === p.key ? "active" : ""}`}
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
          <div className="canada-table overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Draw Type</th>
                  <th className="px-4 py-3 text-left">Program</th>
                  <th className="px-4 py-3 text-right">Invitations</th>
                  <th className="px-4 py-3 text-right">CRS Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((draw) => (
                  <tr key={draw.id} className="transition-colors border-t border-white/5">
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(draw.draw_date).toLocaleDateString("en-CA", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        draw.province === null
                          ? "bg-red-900/60 text-red-300"
                          : "bg-blue-900/60 text-blue-300"
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
      <section className="canada-card p-6">
        <h2 className="text-lg font-semibold mb-1">Get Notified on New Draws — Free</h2>
        <p className="text-sm text-gray-400 mb-4">
          We&apos;ll email you instantly when a new Express Entry or PNP draw is announced.
        </p>
        {subscribed ? (
          <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
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
              className="canada-input py-2 text-sm flex-1"
            />
            <button type="submit" className="canada-btn whitespace-nowrap">
              Notify Me on New Draws
            </button>
          </form>
        )}
      </section>

      {/* Cross-tool: Pathway link */}
      <a href="/pathway" className="canada-next-step" style={{ textDecoration: "none", cursor: "pointer" }}>
        <span className="text-2xl">🗺️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">New to Express Entry?</p>
          <p className="text-xs text-gray-400 mt-0.5">Take our 2-minute quiz to find the best immigration pathway for you</p>
        </div>
        <span className="text-gray-400 text-sm whitespace-nowrap">Find Pathway →</span>
      </a>
    </PageLayout>
  );
}
