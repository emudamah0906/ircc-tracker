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

// TEF Canada — minimum raw scores per CLB level (L:0-360, R:0-300, W:0-450, S:0-450)
const TEF_TABLE = [
  { clb: 10, L: 316, R: 263, W: 393, S: 393 },
  { clb: 9,  L: 298, R: 248, W: 371, S: 371 },
  { clb: 8,  L: 280, R: 233, W: 349, S: 349 },
  { clb: 7,  L: 249, R: 207, W: 310, S: 310 },
  { clb: 6,  L: 217, R: 181, W: 271, S: 271 },
  { clb: 5,  L: 181, R: 151, W: 226, S: 226 },
  { clb: 4,  L: 145, R: 121, W: 181, S: 181 },
];

// TCF Canada — minimum scores per CLB (L/R:100-699, W/S:1-20)
const TCF_TABLE = [
  { clb: 10, L: 549, R: 549, W: 16, S: 16 },
  { clb: 9,  L: 523, R: 524, W: 14, S: 14 },
  { clb: 8,  L: 503, R: 499, W: 12, S: 12 },
  { clb: 7,  L: 458, R: 453, W: 10, S: 10 },
  { clb: 6,  L: 398, R: 406, W: 7,  S: 7  },
  { clb: 5,  L: 369, R: 375, W: 6,  S: 6  },
  { clb: 4,  L: 331, R: 342, W: 4,  S: 4  },
];

function getIELTSCLB(score: number, skill: "L" | "R" | "W" | "S"): number {
  for (const row of IELTS_TABLE) {
    if (score >= row[skill]) return row.clb;
  }
  return 3;
}

function getCELPIPCLB(level: number): number {
  if (level < 1) return 0;
  if (level > 12) return 12;
  return level;
}

function getTEFCLB(score: number, skill: "L" | "R" | "W" | "S"): number {
  for (const row of TEF_TABLE) {
    if (score >= row[skill]) return row.clb;
  }
  return 3;
}

function getTCFCLB(score: number, skill: "L" | "R" | "W" | "S"): number {
  for (const row of TCF_TABLE) {
    if (score >= row[skill]) return row.clb;
  }
  return 3;
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

type TestType = "ielts" | "celpip" | "tef" | "tcf";

export default function CLBPage() {
  const [test, setTest] = useState<TestType>("ielts");
  const [ielts, setIelts] = useState({ L: "", R: "", W: "", S: "" });
  const [celpip, setCelpip] = useState({ L: "", R: "", W: "", S: "" });
  const [tef, setTef] = useState({ L: "", R: "", W: "", S: "" });
  const [tcf, setTcf] = useState({ L: "", R: "", W: "", S: "" });

  const results: { L: number | null; R: number | null; W: number | null; S: number | null } =
    test === "ielts"
      ? {
          L: ielts.L ? getIELTSCLB(parseFloat(ielts.L), "L") : null,
          R: ielts.R ? getIELTSCLB(parseFloat(ielts.R), "R") : null,
          W: ielts.W ? getIELTSCLB(parseFloat(ielts.W), "W") : null,
          S: ielts.S ? getIELTSCLB(parseFloat(ielts.S), "S") : null,
        }
      : test === "celpip"
      ? {
          L: celpip.L ? getCELPIPCLB(parseInt(celpip.L)) : null,
          R: celpip.R ? getCELPIPCLB(parseInt(celpip.R)) : null,
          W: celpip.W ? getCELPIPCLB(parseInt(celpip.W)) : null,
          S: celpip.S ? getCELPIPCLB(parseInt(celpip.S)) : null,
        }
      : test === "tef"
      ? {
          L: tef.L ? getTEFCLB(parseInt(tef.L), "L") : null,
          R: tef.R ? getTEFCLB(parseInt(tef.R), "R") : null,
          W: tef.W ? getTEFCLB(parseInt(tef.W), "W") : null,
          S: tef.S ? getTEFCLB(parseInt(tef.S), "S") : null,
        }
      : {
          L: tcf.L ? getTCFCLB(parseInt(tcf.L), "L") : null,
          R: tcf.R ? getTCFCLB(parseInt(tcf.R), "R") : null,
          W: tcf.W ? getTCFCLB(parseInt(tcf.W), "W") : null,
          S: tcf.S ? getTCFCLB(parseInt(tcf.S), "S") : null,
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
          <p className="text-sm text-gray-400 mb-1">Select your language test</p>
          <p className="text-xs text-gray-600 mb-3">English tests (IELTS, CELPIP) or French tests (TEF Canada, TCF Canada)</p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {([
              { val: "ielts", label: "IELTS (General)" },
              { val: "celpip", label: "CELPIP" },
              { val: "tef", label: "TEF Canada" },
              { val: "tcf", label: "TCF Canada" },
            ] as const).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setTest(val)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: test === val ? "linear-gradient(135deg,#d52b1e,#a01208)" : "rgba(255,255,255,0.06)",
                  color: test === val ? "white" : "#9ca3af",
                  border: test === val ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {(test === "tef" || test === "tcf") && (
            <p className="text-xs text-blue-400 mt-3">
              French language tests — CLB 7+ in French earns +15 to +30 bonus CRS points.
            </p>
          )}
        </div>

        {/* Score inputs */}
        <div className="canada-card p-6 mb-4">
          <p className="text-sm font-semibold text-white mb-4">Enter your scores</p>
          <div className="grid grid-cols-2 gap-4">
            {(["L", "R", "W", "S"] as const).map((key) => {
              const label = key === "L" ? "Listening" : key === "R" ? "Reading" : key === "W" ? "Writing" : "Speaking";
              const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

              if (test === "ielts") {
                const skill = IELTS_SKILLS.find(s => s.key === key)!;
                return (
                  <div key={key}>
                    <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
                    <select value={ielts[key]} onChange={(e) => setIelts(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm text-white" style={inputStyle}>
                      <option value="">Select score</option>
                      {skill.values.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                );
              }

              if (test === "celpip") {
                return (
                  <div key={key}>
                    <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
                    <select value={celpip[key]} onChange={(e) => setCelpip(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm text-white" style={inputStyle}>
                      <option value="">Select level</option>
                      {CELPIP_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                );
              }

              if (test === "tef") {
                const ranges: Record<string, { min: number; max: number; placeholder: string }> = {
                  L: { min: 0, max: 360, placeholder: "0–360" },
                  R: { min: 0, max: 300, placeholder: "0–300" },
                  W: { min: 0, max: 450, placeholder: "0–450" },
                  S: { min: 0, max: 450, placeholder: "0–450" },
                };
                const r = ranges[key];
                return (
                  <div key={key}>
                    <label className="text-xs text-gray-400 block mb-1.5">{label} <span className="text-gray-600">({r.placeholder})</span></label>
                    <input type="number" min={r.min} max={r.max} value={tef[key]}
                      onChange={(e) => setTef(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={r.placeholder}
                      className="w-full rounded-xl px-3 py-2 text-sm text-white" style={inputStyle} />
                  </div>
                );
              }

              // TCF
              const tcfRanges: Record<string, { min: number; max: number; placeholder: string }> = {
                L: { min: 100, max: 699, placeholder: "100–699" },
                R: { min: 100, max: 699, placeholder: "100–699" },
                W: { min: 1, max: 20, placeholder: "1–20" },
                S: { min: 1, max: 20, placeholder: "1–20" },
              };
              const tr = tcfRanges[key];
              return (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1.5">{label} <span className="text-gray-600">({tr.placeholder})</span></label>
                  <input type="number" min={tr.min} max={tr.max} value={tcf[key]}
                    onChange={(e) => setTcf(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={tr.placeholder}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white" style={inputStyle} />
                </div>
              );
            })}
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
            {test === "ielts" ? "IELTS → CLB Reference Table"
             : test === "celpip" ? "CELPIP → CLB Reference Table"
             : test === "tef" ? "TEF Canada → CLB Reference Table"
             : "TCF Canada → CLB Reference Table"}
          </p>
          {(test === "ielts" || test === "tef") && (
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
                  {(test === "ielts" ? IELTS_TABLE : TEF_TABLE).map((row) => (
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
              {test === "tef" && (
                <p className="text-xs text-gray-600 mt-2">Listening /360 · Reading /300 · Writing /450 · Speaking /450</p>
              )}
            </div>
          )}
          {test === "celpip" && (
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
          {test === "tcf" && (
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
                  {TCF_TABLE.map((row) => (
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
              <p className="text-xs text-gray-600 mt-2">Listening /699 · Reading /699 · Writing /20 · Speaking /20</p>
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
