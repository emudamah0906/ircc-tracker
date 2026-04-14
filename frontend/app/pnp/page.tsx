"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

type Stream = {
  name: string;
  type: "enhanced" | "base";
  minScore?: number;
  requirements: string[];
  tag?: string;
};

type Province = {
  id: string;
  name: string;
  flag: string;
  program: string;
  site: string;
  overview: string;
  streams: Stream[];
  tips: string[];
};

const PROVINCES: Province[] = [
  {
    id: "on",
    name: "Ontario",
    flag: "🏙️",
    program: "Ontario Immigrant Nominee Program (OINP)",
    site: "ontario.ca/oinp",
    overview: "Canada's most popular PNP. Ontario runs regular tech draws and human capital draws aligned with Express Entry.",
    streams: [
      {
        name: "Human Capital Priorities Stream",
        type: "enhanced",
        minScore: 400,
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "CRS score typically 400+",
          "Skilled work experience (TEER 0, 1, 2, or 3)",
          "CLB 7+ language proficiency",
          "Bachelor's degree or higher",
        ],
      },
      {
        name: "French-Speaking Skilled Worker Stream",
        type: "enhanced",
        tag: "French speakers",
        requirements: [
          "Active Express Entry profile",
          "Niveau B2 or higher in French (TEF Canada or TCF Canada)",
          "CLB 6+ in English",
          "Skilled work experience",
        ],
      },
      {
        name: "Skilled Trades Stream",
        type: "enhanced",
        tag: "Trades workers",
        requirements: [
          "Active Express Entry profile",
          "Certificate of qualification in a qualifying trade",
          "CLB 5+ language proficiency",
          "2 years of work experience in the trade",
        ],
      },
      {
        name: "Employer Job Offer — International Student Stream",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Ontario employer job offer",
          "Graduated from an Ontario college or university in last 2 years",
          "Job offer in a qualifying NOC",
          "CLB 7+ language proficiency",
        ],
      },
      {
        name: "Employer Job Offer — Foreign Worker Stream",
        type: "base",
        requirements: [
          "Ontario employer job offer with LMIA",
          "Currently working for the employer in Ontario",
          "At least 2 years work experience in qualifying NOC",
          "Language requirements vary by NOC",
        ],
      },
    ],
    tips: [
      "Ontario draws tend to target high-CRS Express Entry profiles — scores of 440+ improve odds",
      "Tech occupations (NOC 21xxx) get frequent targeted draws",
      "The OINP does not publish a draw schedule — check regularly or set alerts",
    ],
  },
  {
    id: "bc",
    name: "British Columbia",
    flag: "🌲",
    program: "BC Provincial Nominee Program (BC PNP)",
    site: "welcomebc.ca",
    overview: "BC PNP runs on a points-based system (Skills Immigration Registration System — SIRS). Higher SIRS scores get invited first in weekly draws.",
    streams: [
      {
        name: "Skilled Worker Stream",
        type: "base",
        tag: "Most popular",
        requirements: [
          "Job offer from BC employer at prevailing wage",
          "NOC TEER 0, 1, 2, or 3",
          "Minimum 2 years of relevant work experience",
          "Qualify for the job independently",
        ],
      },
      {
        name: "International Graduate Stream",
        type: "base",
        tag: "For graduates",
        requirements: [
          "Job offer from BC employer",
          "Graduated within last 3 years from Canadian post-secondary",
          "NOC TEER 0, 1, 2, or 3",
          "Completed degree/diploma in Canada",
        ],
      },
      {
        name: "Healthcare Professional Stream",
        type: "base",
        tag: "Healthcare",
        requirements: [
          "Job offer in a qualifying healthcare occupation",
          "Registration or eligibility for registration with BC regulatory body",
          "Relevant work experience",
        ],
      },
      {
        name: "Express Entry BC — Skilled Worker",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "BC employer job offer at prevailing wage",
          "NOC TEER 0, 1, 2, or 3",
          "Minimum 2 years relevant work experience",
        ],
      },
      {
        name: "Express Entry BC — International Graduate",
        type: "enhanced",
        tag: "EE + Graduates",
        requirements: [
          "Active Express Entry profile",
          "BC employer job offer",
          "Graduated from Canadian post-secondary in last 3 years",
        ],
      },
      {
        name: "Entry Level and Semi-Skilled (ELSS)",
        type: "base",
        tag: "TEER 4–5",
        requirements: [
          "Job offer from BC employer in tourism, hospitality, food processing, or long-haul trucking",
          "Currently employed in BC in qualifying occupation",
          "NOC TEER 4 or 5 (selected industries only)",
          "CLB 4 language proficiency",
        ],
      },
    ],
    tips: [
      "BC PNP draws happen weekly — SIRS scores typically need to be 90–120+ for most streams",
      "Tech occupations frequently appear in separate tech draws with lower score thresholds",
      "You must have a job offer to apply to most BC streams",
    ],
  },
  {
    id: "ab",
    name: "Alberta",
    flag: "🌾",
    program: "Alberta Advantage Immigration Program (AAIP)",
    site: "alberta.ca/aaip",
    overview: "Alberta's program targets workers in Alberta's key sectors: energy, agriculture, construction, and tech. The province has been running regular Express Entry–aligned draws.",
    streams: [
      {
        name: "Alberta Express Entry Stream",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "NOC TEER 0, 1, 2, or 3",
          "Demonstrate strong ties to Alberta (job offer, family, or prior work/study in AB)",
          "Meet financial requirements",
        ],
      },
      {
        name: "Alberta Opportunity Stream (AOS)",
        type: "base",
        tag: "Most common",
        requirements: [
          "Currently working in Alberta with valid work permit",
          "Job offer from Alberta employer",
          "Minimum 12 months Alberta work experience",
          "Language proficiency (CLB 4–7+ depending on NOC)",
          "Education appropriate for the occupation",
        ],
      },
      {
        name: "Rural Renewal Stream",
        type: "base",
        tag: "Rural communities",
        requirements: [
          "Job offer from employer in a participating rural community",
          "Intention to live and work in the rural community",
          "Meet community-specific requirements",
          "Language proficiency as required",
        ],
      },
      {
        name: "Rural Entrepreneur Stream",
        type: "base",
        tag: "Entrepreneurs",
        requirements: [
          "Minimum net worth of $300,000",
          "Business plan approved by rural community",
          "2+ years business or management experience",
          "Minimum investment of $100,000",
        ],
      },
      {
        name: "Foreign Graduate Entrepreneur Stream",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Graduated from Alberta post-secondary within last 4 years",
          "Business plan or existing business in Alberta",
          "CLB 7+ language proficiency",
          "Proof of funds to support the business",
        ],
      },
    ],
    tips: [
      "Alberta Opportunity Stream is the highest-volume stream — keep Alberta work permit valid",
      "Alberta EE draws have targeted energy sector occupations heavily since 2023",
      "Rural streams offer a pathway for those without urban Canadian experience",
    ],
  },
];

const STREAM_BADGE: Record<string, string> = {
  "Express Entry aligned": "#818cf8",
  "French speakers": "#60a5fa",
  "Trades workers": "#facc15",
  "International graduates": "#34d399",
  "For graduates": "#34d399",
  "EE + Graduates": "#a78bfa",
  "Healthcare": "#f472b6",
  "Most popular": "#fb923c",
  "Most common": "#fb923c",
  "TEER 4–5": "#9ca3af",
  "Rural communities": "#6ee7b7",
  "Entrepreneurs": "#fbbf24",
};

export default function PNPPage() {
  const [activeProvince, setActiveProvince] = useState("on");
  const [expandedStream, setExpandedStream] = useState<string | null>(null);

  const province = PROVINCES.find(p => p.id === activeProvince)!;

  return (
    <PageLayout activeNav="pnp" subtitle="PNP Tracker">
      <div className="max-w-3xl mx-auto">
        <div className="canada-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-xl font-bold text-white">Provincial Nominee Program (PNP) Tracker</h2>
              <p className="text-sm text-gray-400">Explore PNP streams for Ontario, BC, and Alberta</p>
            </div>
          </div>
        </div>

        {/* Province tabs */}
        <div className="flex gap-2 mb-4">
          {PROVINCES.map(p => (
            <button
              key={p.id}
              onClick={() => { setActiveProvince(p.id); setExpandedStream(null); }}
              className="flex-1 px-3 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeProvince === p.id ? "linear-gradient(135deg,#d52b1e,#a01208)" : "rgba(255,255,255,0.06)",
                color: activeProvince === p.id ? "white" : "#9ca3af",
                border: activeProvince === p.id ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {p.flag} {p.name}
            </button>
          ))}
        </div>

        {/* Province overview */}
        <div className="canada-card p-4 mb-4">
          <p className="text-sm font-bold text-white mb-1">{province.program}</p>
          <p className="text-xs text-gray-400 mb-2">{province.overview}</p>
          <p className="text-xs text-gray-600">{province.site}</p>
        </div>

        {/* Streams */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Available Streams ({province.streams.length})</p>
          {province.streams.map((stream, i) => {
            const key = `${province.id}-${i}`;
            const isOpen = expandedStream === key;
            return (
              <div
                key={key}
                className="canada-card p-4 cursor-pointer transition-all"
                style={{ border: isOpen ? "1px solid rgba(213,43,30,0.3)" : "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setExpandedStream(isOpen ? null : key)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: stream.type === "enhanced" ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.06)", color: stream.type === "enhanced" ? "#818cf8" : "#9ca3af" }}>
                        {stream.type === "enhanced" ? "⚡ EE-Enhanced" : "Base Stream"}
                      </span>
                      {stream.tag && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)", color: STREAM_BADGE[stream.tag] ?? "#9ca3af" }}>
                          {stream.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{stream.name}</p>
                    {stream.minScore && (
                      <p className="text-xs text-yellow-400 mt-1">Typical CRS: {stream.minScore}+</p>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2 font-semibold">Key Requirements</p>
                    <ul className="space-y-1.5">
                      {stream.requirements.map((req, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="canada-card p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">💡 Tips for {province.name}</p>
          <ul className="space-y-2">
            {province.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* EE Enhanced info box */}
        <div className="canada-card p-4 mb-4" style={{ borderColor: "rgba(129,140,248,0.2)" }}>
          <p className="text-xs font-semibold text-indigo-300 mb-1">⚡ What is an EE-Enhanced Stream?</p>
          <p className="text-xs text-gray-400">
            Enhanced PNP streams are linked to Express Entry. If nominated, IRCC adds 600 points to your CRS score — virtually guaranteeing an ITA in the next Express Entry draw. You need an active Express Entry profile to apply.
          </p>
        </div>

        {/* Cross-tool banners */}
        <div className="space-y-3">
          <div className="canada-next-step">
            <div>
              <p className="text-sm font-semibold text-white">Check your CRS score</p>
              <p className="text-xs text-gray-400 mt-0.5">PNP nomination adds 600 points to your CRS</p>
            </div>
            <a href="/crs" className="canada-btn text-xs px-4 py-2 flex-shrink-0" style={{ textDecoration: "none" }}>
              CRS Calculator →
            </a>
          </div>
          <div className="canada-next-step">
            <div>
              <p className="text-sm font-semibold text-white">Find your best pathway</p>
              <p className="text-xs text-gray-400 mt-0.5">See if PNP is right for your profile</p>
            </div>
            <a href="/pathway" className="canada-btn text-xs px-4 py-2 flex-shrink-0" style={{ textDecoration: "none" }}>
              Pathway Finder →
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
