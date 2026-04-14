"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

const IELTS_TABLE = [
  { clb: 10, L: 8.5, R: 8.0, W: 7.5, S: 7.5 },
  { clb: 9,  L: 8.0, R: 7.0, W: 7.0, S: 7.0 },
  { clb: 8,  L: 7.5, R: 6.5, W: 6.5, S: 6.5 },
  { clb: 7,  L: 6.0, R: 6.0, W: 6.0, S: 6.0 },
  { clb: 6,  L: 5.5, R: 5.0, W: 5.5, S: 5.5 },
  { clb: 5,  L: 5.0, R: 4.0, W: 5.0, S: 5.0 },
  { clb: 4,  L: 4.5, R: 3.5, W: 4.0, S: 4.0 },
];

function getIELTSCLB(score: number, skill: "L" | "R" | "W" | "S"): number {
  for (const row of IELTS_TABLE) {
    if (score >= row[skill]) return row.clb;
  }
  return 3;
}

// CELPIP levels map 1:1 to CLB (1–12)
function getCELPIPCLB(level: number): number {
  if (level < 1) return 0;
  if (level > 12) return 12;
  return level;
}

const CLB_POINTS: Record<number, number> = {
  10: 32, 9: 29, 8: 22, 7: 16, 6: 8, 5: 6, 4: 6,
};

function clbColor(clb: number) {
  if (clb >= 9) return "#4ade80";
  if (clb >= 7) return "#facc15";
  if (clb >= 5) return "#fb923c";
  return "#f87171";
}

const IELTS_SKILLS = [
  { key: "L" as const, label: "Listening", values: ["4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"] },
  { key: "R" as const, label: "Reading",   values: ["3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"] },
  { key: "W" as const, label: "Writing",   values: ["4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"] },
  { key: "S" as const, label: "Speaking",  values: ["4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0"] },
];

const CELPIP_LEVELS = ["4","5","6","7","8","9","10","11","12"];

export default function CLBPage() {
  const [test, setTest] = useState<"ielts" | "celpip">("ielts");
  const [ielts, setIelts] = useState({ L: "", R: "", W: "", S: "" });
  const [celpip, setCelpip] = useState({ L: "", R: "", W: "", S: "" });

  const results =
    test === "ielts"
      ? {
          L: ielts.L ? getIELTSCLB(parseFloat(ielts.L), "L") : null,
          R: ielts.R ? getIELTSCLB(parseFloat(ielts.R), "R") : null,
          W: ielts.W ? getIELTSCLB(parseFloat(ielts.W), "W") : null,
          S: ielts.S ? getIELTSCLB(parseFloat(ielts.S), "S") : null,
        }
      : {
          L: celpip.L ? getCELPIPCLB(parseInt(celpip.L)) : null,
          R: celpip.R ? getCELPIPCLB(parseInt(celpip.R)) : null,
          W: celpip.W ? getCELPIPCLB(parseInt(celpip.W)) : null,
          S: celpip.S ? getCELPIPCLB(parseInt(celpip.S)) : null,
        };

  const validResults = Object.values(results).filter((v): v is number => v !== null);
  const minCLB = validResults.length === 4 ? Math.min(...validResults) : null;
  const allFilled = validResults.length === 4;

  return (
    <PageLayout activeNav="clb" subtitle="CLB Score Converter">
      <div className="max-w-2xl mx-auto">
        <div className="canada-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔤</span>
            <div>
              <h2 className="text-xl font-bold text-white">CLB Score Converter</h2>
              <p className="text-sm text-gray-400">Convert IELTS or CELPIP scores to Canadian Language Benchmarks</p>
            </div>
          </div>
        </div>

        {/* Test selector */}
        <div className="canada-card p-6 mb-4">
          <p className="text-sm text-gray-400 mb-3">Select your language test</p>
          <div className="flex gap-3">
            {(["ielts", "celpip"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTest(t)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: test === t ? "linear-gradient(135deg,#d52b1e,#a01208)" : "rgba(255,255,255,0.06)",
                  color: test === t ? "white" : "#9ca3af",
                  border: test === t ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {t === "ielts" ? "IELTS (General)" : "CELPIP"}
              </button>
            ))}
          </div>
        </div>

        {/* Score inputs */}
        <div className="canada-card p-6 mb-4">
          <p className="text-sm font-semibold text-white mb-4">Enter your scores</p>
          <div className="grid grid-cols-2 gap-4">
            {IELTS_SKILLS.map((skill) => (
              <div key={skill.key}>
                <label className="text-xs text-gray-400 block mb-1.5">{skill.label}</label>
                {test === "ielts" ? (
                  <select
                    value={ielts[skill.key]}
                    onChange={(e) => setIelts(prev => ({ ...prev, [skill.key]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="">Select score</option>
                    {skill.values.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={celpip[skill.key]}
                    onChange={(e) => setCelpip(prev => ({ ...prev, [skill.key]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <option value="">Select level</option>
                    {CELPIP_LEVELS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {validResults.length > 0 && (
          <div className="canada-card p-6 mb-4">
            <p className="text-sm font-semibold text-white mb-4">Your CLB Scores</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {(["L","R","W","S"] as const).map((k, i) => {
                const labels = ["Listening","Reading","Writing","Speaking"];
                const val = results[k];
                return (
                  <div key={k} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs text-gray-500 mb-1">{labels[i]}</p>
                    {val !== null ? (
                      <p className="text-2xl font-bold" style={{ color: clbColor(val) }}>CLB {val}</p>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>
                );
              })}
            </div>

            {allFilled && minCLB !== null && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Overall CLB (lowest skill)</p>
                    <p className="text-2xl font-bold text-white mt-0.5">CLB {minCLB}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Express Entry language points</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: clbColor(minCLB) }}>
                      {CLB_POINTS[minCLB] ?? (minCLB >= 10 ? 32 : "< 6")} pts (per language)
                    </p>
                  </div>
                </div>
                {minCLB < 7 && (
                  <p className="text-xs text-yellow-400 mt-3">
                    CLB 7 is the minimum for Federal Skilled Worker and Canadian Experience Class.
                  </p>
                )}
                {minCLB >= 9 && (
                  <p className="text-xs text-green-400 mt-3">
                    CLB 9+ earns maximum CRS language points. Excellent score!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reference table */}
        <div className="canada-card p-6">
          <p className="text-sm font-semibold text-white mb-4">
            {test === "ielts" ? "IELTS → CLB Reference Table" : "CELPIP → CLB Reference Table"}
          </p>
          {test === "ielts" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-2 pr-3">CLB</th>
                    <th className="text-center py-2 px-2">Listening</th>
                    <th className="text-center py-2 px-2">Reading</th>
                    <th className="text-center py-2 px-2">Writing</th>
                    <th className="text-center py-2 px-2">Speaking</th>
                  </tr>
                </thead>
                <tbody>
                  {IELTS_TABLE.map((row) => (
                    <tr key={row.clb} className="border-t border-white/5">
                      <td className="py-2 pr-3 font-bold" style={{ color: clbColor(row.clb) }}>CLB {row.clb}</td>
                      <td className="text-center py-2 px-2 text-gray-300">{row.L}</td>
                      <td className="text-center py-2 px-2 text-gray-300">{row.R}</td>
                      <td className="text-center py-2 px-2 text-gray-300">{row.W}</td>
                      <td className="text-center py-2 px-2 text-gray-300">{row.S}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-2 pr-4">CELPIP Level</th>
                    <th className="text-left py-2">CLB Equivalent</th>
                    <th className="text-left py-2">Express Entry CRS pts</th>
                  </tr>
                </thead>
                <tbody>
                  {[12,11,10,9,8,7,6,5,4].map((lvl) => (
                    <tr key={lvl} className="border-t border-white/5">
                      <td className="py-2 pr-4 font-bold text-gray-300">Level {lvl}</td>
                      <td className="py-2 font-bold" style={{ color: clbColor(lvl) }}>CLB {lvl}</td>
                      <td className="py-2 text-gray-400">{CLB_POINTS[Math.min(lvl,10)] ?? "—"} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-4">Source: IRCC official language requirements. Scores shown are minimums for each CLB level.</p>
        </div>

        {/* Cross-tool banner */}
        <div className="canada-next-step mt-4">
          <div>
            <p className="text-sm font-semibold text-white">Use your CLB score in CRS Calculator</p>
            <p className="text-xs text-gray-400 mt-0.5">Language is worth up to 160 CRS points</p>
          </div>
          <a href="/crs" className="canada-btn text-xs px-4 py-2 flex-shrink-0" style={{ textDecoration: "none" }}>
            Calculate CRS →
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
