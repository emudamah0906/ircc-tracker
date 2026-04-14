"use client";

import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";

type NOCEntry = {
  code: string;
  title: string;
  teer: 0 | 1 | 2 | 3 | 4 | 5;
  category: string;
  programs: string[];
};

const NOC_DATA: NOCEntry[] = [
  // Management
  { code: "10010", title: "Financial managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "10020", title: "Human resources managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "10030", title: "Purchasing managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "20012", title: "Computer and information systems managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "20020", title: "Engineering managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "30010", title: "Nursing coordinators and supervisors", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "40020", title: "School principals and administrators", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "60010", title: "Corporate sales managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  { code: "70010", title: "Construction managers", teer: 0, category: "Management", programs: ["FSW", "CEC", "PNP"] },
  // Business/Finance
  { code: "11100", title: "Financial auditors and accountants", teer: 1, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "11101", title: "Financial analysts", teer: 1, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "11102", title: "Financial and investment analysts", teer: 1, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "11200", title: "Human resources professionals", teer: 1, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "11201", title: "Professional occupations in business management consulting", teer: 1, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "13100", title: "Administrative officers", teer: 2, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "13110", title: "Accounting technicians and bookkeepers", teer: 2, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  { code: "14100", title: "Administrative assistants", teer: 3, category: "Business & Finance", programs: ["FSW", "CEC", "PNP"] },
  // Technology
  { code: "21211", title: "Data scientists", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21220", title: "Cybersecurity specialists", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21221", title: "Business systems specialists", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21222", title: "Information systems specialists", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21223", title: "Database analysts and data administrators", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21230", title: "Computer engineers (except software engineers)", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21231", title: "Software engineers and designers", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21232", title: "Software developers and programmers", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21233", title: "Web designers", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21234", title: "Web developers and programmers", teer: 1, category: "Technology", programs: ["FSW", "CEC", "PNP", "Tech Stream"] },
  { code: "21240", title: "Computer network and web technicians", teer: 2, category: "Technology", programs: ["FSW", "CEC", "PNP"] },
  { code: "21241", title: "Telecommunication carriers installers", teer: 2, category: "Technology", programs: ["FSW", "CEC"] },
  { code: "22220", title: "Computer network technicians", teer: 2, category: "Technology", programs: ["FSW", "CEC", "PNP"] },
  // Engineering
  { code: "21300", title: "Civil engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "21301", title: "Mechanical engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "21310", title: "Electrical and electronics engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "21311", title: "Chemical engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "21320", title: "Mining engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "21321", title: "Petroleum engineers", teer: 1, category: "Engineering", programs: ["FSW", "CEC", "PNP"] },
  { code: "22300", title: "Civil engineering technologists and technicians", teer: 2, category: "Engineering", programs: ["FSW", "CEC"] },
  { code: "22301", title: "Mechanical engineering technologists and technicians", teer: 2, category: "Engineering", programs: ["FSW", "CEC"] },
  { code: "22310", title: "Electrical and electronics engineering technologists", teer: 2, category: "Engineering", programs: ["FSW", "CEC"] },
  // Healthcare
  { code: "31100", title: "Specialist physicians", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP", "Rural"] },
  { code: "31102", title: "General practitioners and family physicians", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP", "Rural"] },
  { code: "31110", title: "Dentists", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP"] },
  { code: "31120", title: "Pharmacists", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP"] },
  { code: "31200", title: "Registered nurses and registered psychiatric nurses", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP", "Rural"] },
  { code: "31201", title: "Nurse practitioners", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP"] },
  { code: "31300", title: "Physiotherapists", teer: 1, category: "Healthcare", programs: ["FSW", "CEC", "PNP"] },
  { code: "32101", title: "Licensed practical nurses", teer: 2, category: "Healthcare", programs: ["FSW", "CEC", "PNP"] },
  { code: "32102", title: "Respiratory therapists", teer: 2, category: "Healthcare", programs: ["FSW", "CEC"] },
  { code: "33102", title: "Nurse aides, orderlies and patient service associates", teer: 3, category: "Healthcare", programs: ["CEC", "PNP"] },
  // Education
  { code: "41200", title: "University professors and lecturers", teer: 1, category: "Education", programs: ["FSW", "CEC"] },
  { code: "41210", title: "Secondary school teachers", teer: 1, category: "Education", programs: ["FSW", "CEC", "PNP"] },
  { code: "41220", title: "Elementary school and kindergarten teachers", teer: 1, category: "Education", programs: ["FSW", "CEC", "PNP"] },
  { code: "42201", title: "Early childhood educators and assistants", teer: 2, category: "Education", programs: ["FSW", "CEC", "PNP"] },
  // Social Services
  { code: "41300", title: "Social workers", teer: 1, category: "Social Services", programs: ["FSW", "CEC", "PNP"] },
  { code: "41301", title: "Family, marriage and other related counsellors", teer: 1, category: "Social Services", programs: ["FSW", "CEC"] },
  { code: "42100", title: "Community and social service workers", teer: 2, category: "Social Services", programs: ["FSW", "CEC"] },
  // Skilled Trades
  { code: "72010", title: "Electricians (except industrial and power system)", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC", "PNP"] },
  { code: "72020", title: "Industrial electricians", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC", "PNP"] },
  { code: "72100", title: "Plumbers", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC", "PNP"] },
  { code: "72102", title: "Steamfitters, pipefitters and sprinkler system installers", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC", "PNP"] },
  { code: "72200", title: "Welders and related machine operators", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC"] },
  { code: "72300", title: "Heavy equipment operators (except crane)", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC"] },
  { code: "72310", title: "Crane operators", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC"] },
  { code: "73100", title: "Carpenters", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC", "PNP"] },
  { code: "73110", title: "Bricklayers", teer: 2, category: "Skilled Trades", programs: ["FSW", "FST", "CEC"] },
  { code: "73200", title: "Residential and commercial installers and servicers", teer: 2, category: "Skilled Trades", programs: ["FSW", "CEC"] },
  // Food/Hospitality
  { code: "62020", title: "Chefs", teer: 2, category: "Food & Hospitality", programs: ["FSW", "CEC", "PNP"] },
  { code: "63200", title: "Cooks", teer: 3, category: "Food & Hospitality", programs: ["CEC", "PNP"] },
  // Transportation
  { code: "73300", title: "Transport truck drivers", teer: 3, category: "Transportation", programs: ["CEC", "PNP"] },
  { code: "72403", title: "Aircraft mechanics and aircraft inspectors", teer: 2, category: "Transportation", programs: ["FSW", "CEC"] },
];

const TEER_INFO: Record<number, { label: string; color: string; ee: boolean }> = {
  0: { label: "TEER 0 — Management", color: "#818cf8", ee: true },
  1: { label: "TEER 1 — University degree", color: "#4ade80", ee: true },
  2: { label: "TEER 2 — College diploma / 2yr apprenticeship", color: "#facc15", ee: true },
  3: { label: "TEER 3 — College diploma / short training", color: "#fb923c", ee: true },
  4: { label: "TEER 4 — Some secondary school", color: "#9ca3af", ee: false },
  5: { label: "TEER 5 — On-the-job training", color: "#6b7280", ee: false },
};

const CATEGORIES = ["All", ...Array.from(new Set(NOC_DATA.map(n => n.category)))];

export default function NOCPage() {
  const [search, setSearch] = useState("");
  const [filterTEER, setFilterTEER] = useState<string>("All");
  const [filterCat, setFilterCat] = useState("All");
  const [selected, setSelected] = useState<NOCEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return NOC_DATA.filter((n) => {
      const matchQ = !q || n.title.toLowerCase().includes(q) || n.code.includes(q);
      const matchT = filterTEER === "All" || n.teer.toString() === filterTEER;
      const matchC = filterCat === "All" || n.category === filterCat;
      return matchQ && matchT && matchC;
    });
  }, [search, filterTEER, filterCat]);

  return (
    <PageLayout activeNav="noc" subtitle="NOC Code Finder">
      <div className="max-w-3xl mx-auto">
        <div className="canada-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔍</span>
            <div>
              <h2 className="text-xl font-bold text-white">NOC Code Finder</h2>
              <p className="text-sm text-gray-400">Find your NOC 2021 code and check Express Entry eligibility</p>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="canada-card p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search job title or NOC code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={filterTEER}
              onChange={(e) => setFilterTEER(e.target.value)}
              className="rounded-xl px-3 py-1.5 text-xs text-gray-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="All">All TEER levels</option>
              {[0,1,2,3,4,5].map(t => (
                <option key={t} value={t.toString()}>TEER {t}{t <= 3 ? " ✓ Express Entry" : ""}</option>
              ))}
            </select>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded-xl px-3 py-1.5 text-xs text-gray-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 self-center">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* TEER legend */}
        <div className="canada-card p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2">Express Entry eligibility by TEER</p>
          <div className="flex flex-wrap gap-2">
            {[0,1,2,3,4].map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: TEER_INFO[t].color, border: "1px solid rgba(255,255,255,0.08)" }}>
                TEER {t} {TEER_INFO[t].ee ? "✓ EE eligible" : "✗ Not EE"}
              </span>
            ))}
          </div>
        </div>

        {/* Results list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="canada-card p-8 text-center">
              <p className="text-gray-500 text-sm">No NOC codes found. Try a different search term.</p>
            </div>
          ) : (
            filtered.map((noc) => (
              <div
                key={noc.code}
                onClick={() => setSelected(selected?.code === noc.code ? null : noc)}
                className="canada-card p-4 cursor-pointer transition-all hover:border-white/20"
                style={{ border: selected?.code === noc.code ? "1px solid rgba(213,43,30,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-bold text-gray-400">{noc.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: TEER_INFO[noc.teer].color }}>
                        TEER {noc.teer}
                      </span>
                      <span className="text-xs text-gray-600">{noc.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{noc.title}</p>
                  </div>
                  {TEER_INFO[noc.teer].ee && (
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full flex-shrink-0">EE eligible</span>
                  )}
                </div>

                {selected?.code === noc.code && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Eligible immigration programs:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {noc.programs.map(p => (
                        <span key={p} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(213,43,30,0.15)", color: "#fca5a5", border: "1px solid rgba(213,43,30,0.3)" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">{TEER_INFO[noc.teer].label}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Cross-tool */}
        <div className="canada-next-step mt-6">
          <div>
            <p className="text-sm font-semibold text-white">Know your NOC? Find the right pathway</p>
            <p className="text-xs text-gray-400 mt-0.5">TEER 0–3 qualifies for Express Entry</p>
          </div>
          <a href="/pathway" className="canada-btn text-xs px-4 py-2 flex-shrink-0" style={{ textDecoration: "none" }}>
            Pathway Finder →
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
