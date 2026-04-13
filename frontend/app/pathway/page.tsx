"use client";

import { useState } from "react";
import Header from "@/components/Header";

type Answers = {
  location: "inside" | "outside" | "";
  hasCanadianWork: "yes" | "no" | "";
  canadianWorkYears: number;
  hasJobOffer: "yes" | "no" | "";
  hasFamilyInCanada: "spouse" | "sibling" | "none" | "";
  education: "highschool" | "diploma" | "bachelors" | "masters" | "";
  foreignWorkYears: number;
  avgCLB: number;
  province: string;
  isTrades: "yes" | "no" | "";
  isStudent: "yes" | "no" | "";
};

type Pathway = {
  name: string;
  icon: string;
  match: "strong" | "possible" | "unlikely";
  description: string;
  requirements: string[];
  nextStep: string;
  link?: string;
};

const DEFAULT: Answers = {
  location: "",
  hasCanadianWork: "",
  canadianWorkYears: 0,
  hasJobOffer: "",
  hasFamilyInCanada: "",
  education: "",
  foreignWorkYears: 0,
  avgCLB: 7,
  province: "",
  isTrades: "",
  isStudent: "",
};

function getPathways(a: Answers): Pathway[] {
  const pathways: Pathway[] = [];

  // Canadian Experience Class (CEC)
  if (a.location === "inside") {
    pathways.push({
      name: "Canadian Experience Class (CEC)",
      icon: "🇨🇦",
      match: a.canadianWorkYears >= 1 && a.avgCLB >= 7 ? "strong" : a.canadianWorkYears >= 1 ? "possible" : "unlikely",
      description: "For people already working in Canada. One of the fastest paths to PR.",
      requirements: [
        "1+ year of skilled work experience in Canada (TEER 0, 1, 2, or 3)",
        "Meet language requirements (CLB 7 for TEER 0/1, CLB 5 for TEER 2/3)",
        "Plan to live outside Quebec",
      ],
      nextStep: "Create an Express Entry profile and enter the CEC pool. Draws happen every 2 weeks.",
      link: "/crs",
    });
  }

  // Federal Skilled Worker (FSW)
  if (a.location === "outside" || a.location === "") {
    pathways.push({
      name: "Federal Skilled Worker (FSW)",
      icon: "🌍",
      match: a.foreignWorkYears >= 1 && a.avgCLB >= 7 && (a.education === "bachelors" || a.education === "masters") ? "strong" : a.foreignWorkYears >= 1 ? "possible" : "unlikely",
      description: "Main path for skilled workers outside Canada. Requires meeting 67-point minimum.",
      requirements: [
        "1+ year of continuous skilled work experience (TEER 0, 1, 2, or 3) in the last 10 years",
        "CLB 7 or higher in all language skills",
        "Canadian equivalent education assessment (ECA)",
        "Score 67+ on FSW point grid",
      ],
      nextStep: "Get your ECA done, take IELTS/CELPIP, then create an Express Entry FSW profile.",
      link: "/crs",
    });
  }

  // Federal Skilled Trades (FST)
  if (a.isTrades === "yes") {
    pathways.push({
      name: "Federal Skilled Trades (FST)",
      icon: "🔧",
      match: "strong",
      description: "For electricians, plumbers, carpenters, welders and other skilled trades workers.",
      requirements: [
        "2+ years of full-time skilled trades experience in last 5 years",
        "Valid job offer OR certificate of qualification in your trade",
        "CLB 5 for speaking/listening, CLB 4 for reading/writing",
      ],
      nextStep: "Apply through Express Entry Federal Skilled Trades category.",
    });
  }

  // Provincial Nominee Program (PNP)
  pathways.push({
    name: "Provincial Nominee Program (PNP)",
    icon: "🏛️",
    match: a.province && a.province !== "undecided" ? "strong" : "possible",
    description: "Each province has its own streams. Often easier than federal Express Entry, especially for people with provincial ties.",
    requirements: [
      "Ties to a specific province (job offer, education, work experience there)",
      "Meet that province's specific stream requirements",
      "Some PNP streams are Express Entry-linked (adds 600 pts to CRS)",
    ],
    nextStep: a.province && a.province !== "undecided"
      ? `Check the ${a.province} provincial immigration website for available streams.`
      : "Decide which province you want to live in, then check their PNP streams.",
    link: "/draws",
  });

  // Atlantic Immigration Program
  if (["Nova Scotia", "New Brunswick", "Prince Edward Island", "Newfoundland"].includes(a.province) || a.province === "") {
    pathways.push({
      name: "Atlantic Immigration Program (AIP)",
      icon: "🌊",
      match: ["Nova Scotia", "New Brunswick", "Prince Edward Island", "Newfoundland"].includes(a.province) ? "strong" : "possible",
      description: "Faster path to PR for people with a job offer in Atlantic Canada.",
      requirements: [
        "Job offer from a designated Atlantic employer",
        "Post-secondary education (or equivalent)",
        "Language: CLB 4 minimum",
        "Settlement funds",
      ],
      nextStep: "Find a designated Atlantic employer willing to hire you, then apply.",
    });
  }

  // Spousal / Family Sponsorship
  if (a.hasFamilyInCanada === "spouse") {
    pathways.push({
      name: "Spousal Sponsorship",
      icon: "💑",
      match: "strong",
      description: "If your spouse or partner is a Canadian citizen or permanent resident, they can sponsor you for PR.",
      requirements: [
        "Your spouse/partner must be a Canadian citizen or PR",
        "They must meet minimum income requirements",
        "You must be legally married or in a common-law/conjugal relationship",
      ],
      nextStep: "Your spouse applies to sponsor you. Processing takes 12–24 months (faster if spouse is Canadian citizen).",
    });
  }

  // Post-Graduation → CEC
  if (a.isStudent === "yes" && a.location === "inside") {
    pathways.push({
      name: "Study → PGWP → CEC",
      icon: "🎓",
      match: "strong",
      description: "Study in Canada, get a Post-Graduation Work Permit, work 1 year, then apply through CEC.",
      requirements: [
        "Complete a program at a DLI (Designated Learning Institution)",
        "Get a PGWP (valid up to 3 years based on program length)",
        "Work 1 year in TEER 0/1/2/3 occupation",
        "Then apply through Canadian Experience Class",
      ],
      nextStep: "Apply for your PGWP before your study permit expires. Then start working toward CEC eligibility.",
    });
  }

  // Rural and Northern Immigration Pilot
  pathways.push({
    name: "Rural & Northern Immigration Pilot",
    icon: "🌲",
    match: a.hasJobOffer === "yes" ? "possible" : "unlikely",
    description: "For smaller communities outside major cities. Less competition, but requires job offer in participating community.",
    requirements: [
      "Job offer from employer in a participating rural community",
      "Meet community-specific requirements",
      "Intention to live in that community",
    ],
    nextStep: "Check if your employer's community participates in RNIP.",
  });

  // Sort: strong first, then possible, then unlikely
  const order = { strong: 0, possible: 1, unlikely: 2 };
  return pathways.sort((a, b) => order[a.match] - order[b.match]);
}

const STEPS = [
  "location", "canadaWork", "jobOffer", "family",
  "education", "language", "province", "trades",
] as const;

export default function PathwayPage() {
  const [answers, setAnswers] = useState<Answers>(DEFAULT);
  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  function set<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else setShowResults(true);
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
    else setShowResults(false);
  }

  const pathways = getPathways(answers);
  const progress = ((step + 1) / STEPS.length) * 100;

  const matchColors = {
    strong: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#4ade80", badge: "bg-green-900/40 text-green-400 border-green-700" },
    possible: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", text: "#facc15", badge: "bg-yellow-900/40 text-yellow-400 border-yellow-700" },
    unlikely: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", text: "#6b7280", badge: "bg-gray-800 text-gray-500 border-gray-700" },
  };

  return (
    <div className="canada-bg min-h-screen text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!showResults ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">🗺️ PR Pathway Finder</h1>
              <p className="text-gray-400 text-sm mt-2">Answer a few questions — we'll tell you which immigration streams fit your profile</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-8">
              <div className="h-1.5 rounded-full bg-red-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 text-right -mt-6 mb-6">Step {step + 1} of {STEPS.length}</p>

            <div className="canada-card p-8 space-y-6">

              {/* Step 0: Location */}
              {step === 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Where are you right now?</h2>
                  <p className="text-xs text-gray-400 mb-5">This determines which pathways are available to you</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "outside", icon: "✈️", label: "Outside Canada", sub: "Applying from my home country" },
                      { val: "inside", icon: "🇨🇦", label: "Inside Canada", sub: "Currently living/working/studying here" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => { set("location", opt.val as "inside" | "outside"); }}
                        className={`p-5 rounded-xl border text-left transition-all ${answers.location === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                        <div className="text-2xl mb-2">{opt.icon}</div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Canadian Work */}
              {step === 1 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Do you have skilled work experience in Canada?</h2>
                  <p className="text-xs text-gray-400 mb-5">TEER 0, 1, 2, or 3 occupations (managers, professionals, technical workers)</p>
                  <div className="space-y-3">
                    {[
                      { val: "yes", label: "Yes", sub: "I have or have had a work permit in Canada" },
                      { val: "no", label: "No", sub: "I have never worked in Canada" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("hasCanadianWork", opt.val as "yes" | "no")}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${answers.hasCanadianWork === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-gray-400 text-sm ml-3">{opt.sub}</span>
                      </button>
                    ))}
                    {answers.hasCanadianWork === "yes" && (
                      <div className="pt-2">
                        <label className="text-xs text-gray-400 mb-1 block">How many years?</label>
                        <select value={answers.canadianWorkYears} onChange={e => set("canadianWorkYears", Number(e.target.value))}
                          className="canada-input py-2 text-sm">
                          {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v === 0 ? "Less than 1 year" : `${v} year${v > 1 ? "s" : ""}`}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Job Offer */}
              {step === 2 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Do you have a Canadian job offer?</h2>
                  <p className="text-xs text-gray-400 mb-5">A valid job offer from a Canadian employer can add points or open additional pathways</p>
                  <div className="space-y-3">
                    {[
                      { val: "yes", label: "Yes, I have a job offer", sub: "From a Canadian employer" },
                      { val: "no", label: "No job offer", sub: "I don't have one yet" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("hasJobOffer", opt.val as "yes" | "no")}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${answers.hasJobOffer === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-gray-400 text-sm ml-3">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Family in Canada */}
              {step === 3 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Do you have family in Canada?</h2>
                  <p className="text-xs text-gray-400 mb-5">Canadian family members can open sponsorship pathways or add CRS points</p>
                  <div className="space-y-3">
                    {[
                      { val: "spouse", label: "Yes — spouse/partner is Canadian citizen or PR", sub: "Spousal sponsorship available" },
                      { val: "sibling", label: "Yes — sibling is Canadian citizen or PR", sub: "Adds 15 CRS points" },
                      { val: "none", label: "No Canadian family", sub: "" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("hasFamilyInCanada", opt.val as "spouse" | "sibling" | "none")}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${answers.hasFamilyInCanada === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        {opt.sub && <div className="text-xs text-gray-400 mt-0.5">{opt.sub}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Education */}
              {step === 4 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">What is your highest level of education?</h2>
                  <p className="text-xs text-gray-400 mb-5">This affects your eligibility for certain streams and your CRS score</p>
                  <div className="space-y-2">
                    {[
                      { val: "highschool", label: "High School / Secondary" },
                      { val: "diploma", label: "Diploma / Certificate (1–2 years)" },
                      { val: "bachelors", label: "Bachelor's Degree" },
                      { val: "masters", label: "Master's Degree or higher" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("education", opt.val as Answers["education"])}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all text-sm ${answers.education === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Language */}
              {step === 5 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">What is your average language CLB score?</h2>
                  <p className="text-xs text-gray-400 mb-5">CLB (Canadian Language Benchmark). IELTS 6.0 ≈ CLB 7, IELTS 7.0 ≈ CLB 8, IELTS 8.0 ≈ CLB 9</p>
                  <div className="space-y-2">
                    {[
                      { val: 5, label: "CLB 4–5", sub: "Basic proficiency" },
                      { val: 7, label: "CLB 6–7", sub: "IELTS ~5.5–6.5" },
                      { val: 8, label: "CLB 8", sub: "IELTS ~7.0" },
                      { val: 9, label: "CLB 9–10", sub: "IELTS ~7.5+" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("avgCLB", opt.val)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex justify-between items-center ${answers.avgCLB === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        <span className="font-semibold text-sm">{opt.label}</span>
                        <span className="text-xs text-gray-400">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Province */}
              {step === 6 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Which province/territory do you want to live in?</h2>
                  <p className="text-xs text-gray-400 mb-5">Some provinces have easier PNP streams with lower requirements</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Ontario","British Columbia","Alberta","Saskatchewan","Manitoba","Nova Scotia","New Brunswick","Prince Edward Island","Newfoundland","Not sure"].map(p => (
                      <button key={p} onClick={() => set("province", p === "Not sure" ? "undecided" : p)}
                        className={`p-3 rounded-xl border text-left text-sm transition-all ${answers.province === (p === "Not sure" ? "undecided" : p) ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Trades */}
              {step === 7 && (
                <div>
                  <h2 className="text-lg font-semibold mb-1">Are you a skilled trades worker?</h2>
                  <p className="text-xs text-gray-400 mb-5">e.g. electrician, plumber, welder, carpenter, cook, heavy equipment operator</p>
                  <div className="space-y-3">
                    {[
                      { val: "yes", label: "Yes, I work in a skilled trade" },
                      { val: "no", label: "No, I'm not in skilled trades" },
                    ].map(opt => (
                      <button key={opt.val} onClick={() => set("isTrades", opt.val as "yes" | "no")}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${answers.isTrades === opt.val ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex justify-between pt-2">
                <button onClick={back} className="canada-pill" style={{ opacity: step === 0 ? 0.3 : 1 }} disabled={step === 0}>
                  ← Back
                </button>
                <button onClick={next} className="canada-btn px-8">
                  {step === STEPS.length - 1 ? "See My Pathways →" : "Next →"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Your Immigration Pathways</h1>
              <p className="text-gray-400 text-sm mt-2">Based on your profile — sorted by best match</p>
            </div>

            <div className="space-y-4 mb-6">
              {pathways.filter(p => p.match !== "unlikely").map((p, i) => {
                const c = matchColors[p.match];
                return (
                  <div key={i} className="rounded-xl border p-5 transition-all"
                    style={{ background: c.bg, borderColor: c.border }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <h3 className="font-bold text-white">{p.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${c.badge}`}>
                        {p.match === "strong" ? "✓ Strong Match" : "◎ Possible Match"}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Requirements</p>
                      <ul className="space-y-1">
                        {p.requirements.map((r, j) => (
                          <li key={j} className="text-xs text-gray-300 flex gap-2">
                            <span className="text-gray-600 mt-0.5">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/5 rounded-lg px-3 py-2.5 text-xs text-gray-300">
                      <span className="text-white font-semibold">Next step: </span>{p.nextStep}
                    </div>

                    {p.link && (
                      <a href={p.link} className="mt-3 inline-block text-xs text-red-400 hover:text-red-300">
                        Check your eligibility →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unlikely pathways collapsed */}
            {pathways.filter(p => p.match === "unlikely").length > 0 && (
              <details className="canada-card p-4">
                <summary className="text-sm text-gray-400 cursor-pointer">Other pathways (less likely based on your answers)</summary>
                <div className="mt-3 space-y-3">
                  {pathways.filter(p => p.match === "unlikely").map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-500 border-t border-white/5 pt-3">
                      <span>{p.icon}</span>
                      <div>
                        <span className="font-medium text-gray-400">{p.name}</span>
                        <span className="text-gray-600 ml-2 text-xs">{p.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setStep(0); setShowResults(false); setAnswers(DEFAULT); }}
                className="canada-pill flex-1 text-center">
                ← Start Over
              </button>
              <a href="/dashboard" className="canada-btn flex-1 text-center" style={{ textDecoration: "none" }}>
                Calculate My CRS Score →
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
