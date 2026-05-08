"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import DataFreshness from "@/components/DataFreshness";
import { PNP_DATASET } from "@/lib/ircc-data";

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
  {
    id: "mb",
    name: "Manitoba",
    flag: "🐃",
    program: "Manitoba Provincial Nominee Program (MPNP)",
    site: "immigratemanitoba.com",
    overview: "Points-based program with strong preference for candidates who have family or work ties to Manitoba. Frequent draws for skilled workers, international graduates, and business investors.",
    streams: [
      {
        name: "Skilled Worker in Manitoba (SWM)",
        type: "base",
        tag: "Most common",
        requirements: [
          "6+ months working in Manitoba on a valid work permit",
          "Long-term full-time job offer from Manitoba employer",
          "CLB 4 minimum (CLB 7+ for regulated occupations)",
          "Education and work experience matching the job offer",
        ],
      },
      {
        name: "Skilled Worker Overseas — Strategic Recruitment",
        type: "base",
        tag: "Outside Canada",
        requirements: [
          "Established connection to Manitoba (family, past education or work, or invitation)",
          "Skilled work experience in an in-demand occupation",
          "CLB 7+ language proficiency",
          "Settlement funds",
        ],
      },
      {
        name: "International Education Stream",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Recent graduate from a Manitoba post-secondary institution",
          "Job offer in your field of study OR completed an industry internship",
          "Career employment pathway in Manitoba",
        ],
      },
      {
        name: "Business Investor Stream — Entrepreneur Pathway",
        type: "base",
        tag: "Entrepreneurs",
        requirements: [
          "Net worth of $500,000+",
          "Business plan to invest at least $250,000 in Winnipeg ($150,000 elsewhere in MB)",
          "3+ years business owner / senior manager experience",
          "Exploratory visit to Manitoba",
        ],
      },
    ],
    tips: [
      "Manitoba places heavy weight on existing ties — past study, work, or close family in MB significantly improves selection odds",
      "MPNP runs Expression-of-Interest draws roughly twice a month",
      "Healthcare, trucking, and trades occupations have been frequent priority categories",
    ],
  },
  {
    id: "sk",
    name: "Saskatchewan",
    flag: "🌾",
    program: "Saskatchewan Immigrant Nominee Program (SINP)",
    site: "saskatchewan.ca/immigrating",
    overview: "Points-based system (max 110) with regular Express Entry-aligned and Occupations In-Demand draws. Strong focus on healthcare, trades, and agriculture.",
    streams: [
      {
        name: "International Skilled Worker — Express Entry",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "1+ year of skilled work experience in an in-demand occupation",
          "CLB 7+ language proficiency",
          "Education at the level required for your occupation",
          "60+ SINP points (100-point grid)",
        ],
      },
      {
        name: "International Skilled Worker — Occupations In-Demand",
        type: "base",
        tag: "Most common",
        requirements: [
          "1+ year of work experience in a SINP in-demand occupation",
          "CLB 4 minimum (varies by occupation)",
          "Education matching your occupation",
          "60+ SINP points",
        ],
      },
      {
        name: "Saskatchewan Experience — Existing Work Permit",
        type: "base",
        tag: "Inside Canada",
        requirements: [
          "Currently working in Saskatchewan on a valid work permit",
          "6+ months of SK work experience (varies by occupation type)",
          "Permanent full-time job offer from your employer",
        ],
      },
      {
        name: "Hard-to-Fill Skills Pilot",
        type: "base",
        tag: "TEER 4–5",
        requirements: [
          "Job offer in a designated hard-to-fill occupation (food and beverage, hospitality, retail, etc.)",
          "1+ year of related work experience",
          "Currently working in SK or recent graduate from a SK post-secondary",
        ],
      },
    ],
    tips: [
      "SK uses an Expression of Interest pool — submit your EOI and wait for invitations",
      "Healthcare workers and skilled trades have repeatedly seen low score thresholds",
      "Each draw publishes the minimum SINP score that received an invitation — track them on the SK government site",
    ],
  },
  {
    id: "ns",
    name: "Nova Scotia",
    flag: "🦞",
    program: "Nova Scotia Nominee Program (NSNP)",
    site: "novascotiaimmigration.com",
    overview: "Atlantic-province PNP that runs alongside the Atlantic Immigration Program. Streams target Express Entry candidates, skilled workers with NS job offers, and physicians.",
    streams: [
      {
        name: "Nova Scotia Labour Market Priorities",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "Letter of Interest from NSNP (issued for targeted occupations)",
          "Skilled work experience matching the targeted NOC",
          "CLB 7+ language proficiency",
        ],
      },
      {
        name: "Skilled Worker Stream",
        type: "base",
        tag: "Job offer required",
        requirements: [
          "Permanent full-time job offer from a NS employer",
          "1+ year of work experience in the offered occupation",
          "CLB 5+ for TEER 0/1, CLB 4 for TEER 2/3, CLB 4 for TEER 4 high-demand",
        ],
      },
      {
        name: "Physician Stream",
        type: "base",
        tag: "Healthcare",
        requirements: [
          "Approval from the Nova Scotia Health Authority or IWK Health Centre",
          "Signed return-of-service agreement",
          "Licensure with the College of Physicians and Surgeons of Nova Scotia",
        ],
      },
      {
        name: "International Graduates in Demand",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Recent graduate from a NS post-secondary",
          "1+ year of full-time work experience in an early-childhood educator or licensed practical nurse role in NS",
          "Job offer in your field",
        ],
      },
    ],
    tips: [
      "Labour Market Priorities draws happen sporadically and target specific NOCs — keep your EE profile updated to receive a Letter of Interest",
      "The Atlantic Immigration Program is often a faster path than NSNP for candidates with employer endorsements",
      "Healthcare occupations consistently have the lowest score thresholds",
    ],
  },
  {
    id: "nb",
    name: "New Brunswick",
    flag: "🍁",
    program: "New Brunswick Provincial Nominee Program (NBPNP)",
    site: "welcomenb.ca",
    overview: "Atlantic-province PNP focused on skilled workers with NB ties or job offers, plus Express Entry-aligned draws. The Atlantic Immigration Program also operates here.",
    streams: [
      {
        name: "New Brunswick Express Entry Stream",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "Connection to NB (job offer, family, prior work or study)",
          "Skilled work experience and CLB 7+ language",
        ],
      },
      {
        name: "Skilled Worker with Employer Support",
        type: "base",
        tag: "Job offer required",
        requirements: [
          "Permanent full-time job offer from an NB employer",
          "1+ year of relevant work experience",
          "CLB 4 minimum (varies by NOC)",
        ],
      },
      {
        name: "Strategic Initiative Stream — Francophone",
        type: "base",
        tag: "French speakers",
        requirements: [
          "CLB 7+ in French (TEF or TCF)",
          "Connection to NB (work, study, or family)",
          "Skilled work experience",
        ],
      },
      {
        name: "Entrepreneurial Stream",
        type: "base",
        tag: "Entrepreneurs",
        requirements: [
          "Net worth of $600,000+",
          "Business plan with $250,000+ investment in NB",
          "3+ years of business ownership experience",
          "Exploratory visit to NB",
        ],
      },
    ],
    tips: [
      "NB heavily favours Francophone candidates — French at CLB 7+ unlocks dedicated streams",
      "The Atlantic Immigration Program covers many of the same use cases with a faster timeline",
      "Healthcare and trades job offers carry significant weight",
    ],
  },
  {
    id: "pe",
    name: "Prince Edward Island",
    flag: "🦀",
    program: "PEI Provincial Nominee Program (PEI PNP)",
    site: "princeedwardisland.ca/immigration",
    overview: "PEI runs a points-based EOI system with monthly draws across labour, business, and Express Entry streams. The smallest province PNP by intake but with steady cadence.",
    streams: [
      {
        name: "PEI Express Entry",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "EOI in the PEI pool",
          "Receive an invitation from PEI in a labour-or-Express-Entry draw",
        ],
      },
      {
        name: "Skilled Workers in PEI",
        type: "base",
        tag: "Most common",
        requirements: [
          "Currently working in PEI on a valid work permit",
          "Permanent full-time job offer from PEI employer",
          "CLB 4 minimum (varies by NOC)",
        ],
      },
      {
        name: "International Graduates in PEI",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Graduated from a PEI post-secondary",
          "Job offer in your field from a PEI employer",
          "CLB 4 minimum",
        ],
      },
      {
        name: "Work Permit Holders — Critical Worker",
        type: "base",
        tag: "TEER 4–5",
        requirements: [
          "Job offer in trucking, food processing, hospitality, or other critical occupation",
          "Currently working in PEI on a valid work permit",
          "6+ months PEI work experience",
        ],
      },
    ],
    tips: [
      "PEI runs scheduled monthly EOI draws — the schedule is published in advance",
      "Healthcare workers and PEI graduates have priority access in most draws",
      "Most labour-stream candidates need a PEI work permit before being eligible",
    ],
  },
  {
    id: "nl",
    name: "Newfoundland & Labrador",
    flag: "🐋",
    program: "Newfoundland and Labrador Provincial Nominee Program (NLPNP)",
    site: "gov.nl.ca/immigration",
    overview: "Smaller PNP focused on skilled workers with NL job offers, international graduates, and priority occupations. The Atlantic Immigration Program is the main alternative.",
    streams: [
      {
        name: "NL Express Entry Skilled Worker",
        type: "enhanced",
        tag: "Express Entry aligned",
        requirements: [
          "Active Express Entry profile",
          "Job offer from a NL employer (or 1 year of high-skilled NL work experience)",
          "CLB 7+ language proficiency",
        ],
      },
      {
        name: "Skilled Worker Category",
        type: "base",
        tag: "Job offer required",
        requirements: [
          "Job offer from a NL employer",
          "Already working in NL on a valid work permit (or willing to relocate)",
          "Education and experience matching your job offer",
        ],
      },
      {
        name: "International Graduate Category",
        type: "base",
        tag: "International graduates",
        requirements: [
          "Graduated from a NL post-secondary",
          "Job offer in your field from a NL employer",
          "Career-path employment plan",
        ],
      },
      {
        name: "Priority Skills NL",
        type: "base",
        tag: "Healthcare",
        requirements: [
          "Skills in tech, aquaculture/ocean, or healthcare priority occupations",
          "Connection to NL (job offer, prior visit, or recruitment-mission contact)",
          "CLB 7+ language proficiency",
        ],
      },
    ],
    tips: [
      "Atlantic Immigration Program is often a faster path — NLPNP is best when AIP isn't available",
      "Healthcare and tech occupations are the priority focus areas",
      "NL has limited annual nomination quotas — apply as soon as you receive a Letter of Interest",
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
              <p className="text-sm text-gray-400">Explore PNP streams for {PROVINCES.length} Canadian provinces. Quebec runs its own selection program (CSQ) and is not part of PNP.</p>
            </div>
          </div>
        </div>

        {/* Province tabs — wrap to multiple rows on smaller screens since
            we now cover 9 provinces. */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PROVINCES.map(p => (
            <button
              key={p.id}
              onClick={() => { setActiveProvince(p.id); setExpandedStream(null); }}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
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

        <DataFreshness
          lastVerified={PNP_DATASET.lastVerified}
          source={PNP_DATASET.source}
          sourceLabel={PNP_DATASET.sourceLabel}
          cadence={PNP_DATASET.cadence}
          note={PNP_DATASET.note}
        />

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
