"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";

type ChecklistItem = { id: string; label: string; note?: string; required: boolean };
type ChecklistCategory = { title: string; items: ChecklistItem[] };

const CHECKLISTS: Record<string, { title: string; description: string; categories: ChecklistCategory[] }> = {
  fsw: {
    title: "Federal Skilled Worker (FSW)",
    description: "Express Entry stream for skilled workers with foreign experience",
    categories: [
      {
        title: "Identity & Travel Documents",
        items: [
          { id: "fsw-passport", label: "Valid passport (all pages)", note: "Must be valid for at least 6 months", required: true },
          { id: "fsw-passport-old", label: "Previous passports (if any)", required: false },
          { id: "fsw-photos", label: "Digital photos (per IRCC specs)", note: "35mm x 45mm, white background", required: true },
        ],
      },
      {
        title: "Language Proficiency",
        items: [
          { id: "fsw-lang-eng", label: "English test results (IELTS / CELPIP)", note: "Must be less than 2 years old", required: true },
          { id: "fsw-lang-fr", label: "French test results (TEF Canada / TCF Canada)", note: "Required if claiming French points", required: false },
        ],
      },
      {
        title: "Education",
        items: [
          { id: "fsw-edu-degree", label: "Degree / diploma / certificate (all)", required: true },
          { id: "fsw-edu-transcripts", label: "Official transcripts from all institutions", required: true },
          { id: "fsw-eca", label: "Educational Credential Assessment (ECA)", note: "Required for foreign degrees — from WES, IQAS, etc.", required: true },
        ],
      },
      {
        title: "Work Experience",
        items: [
          { id: "fsw-work-letters", label: "Reference / experience letters from all employers", note: "Must include: title, duties, hours/week, salary, dates", required: true },
          { id: "fsw-work-paystubs", label: "Pay stubs or tax records", required: false },
          { id: "fsw-work-noc", label: "NOC code identified for each position", required: true },
        ],
      },
      {
        title: "Proof of Funds",
        items: [
          { id: "fsw-funds-bank", label: "Bank statements (6 months)", note: "Must show consistent balance — see Proof of Funds calculator", required: true },
          { id: "fsw-funds-letter", label: "Official bank letter confirming funds", required: true },
        ],
      },
      {
        title: "Other Documents",
        items: [
          { id: "fsw-police", label: "Police clearance certificates (all countries lived 6+ months)", required: true },
          { id: "fsw-civil-status", label: "Marriage / divorce certificate (if applicable)", required: false },
          { id: "fsw-job-offer", label: "Job offer letter (if applicable)", note: "LMIA-exempt or positive LMIA", required: false },
        ],
      },
    ],
  },
  cec: {
    title: "Canadian Experience Class (CEC)",
    description: "Express Entry for those with skilled work experience in Canada",
    categories: [
      {
        title: "Identity & Travel Documents",
        items: [
          { id: "cec-passport", label: "Valid passport", required: true },
          { id: "cec-status", label: "Current immigration status document (work/study permit)", required: true },
          { id: "cec-photos", label: "Digital photos", required: true },
        ],
      },
      {
        title: "Language Proficiency",
        items: [
          { id: "cec-lang", label: "IELTS / CELPIP results", note: "CLB 7 minimum for TEER 0–2; CLB 5 for TEER 3", required: true },
        ],
      },
      {
        title: "Canadian Work Experience",
        items: [
          { id: "cec-work-letters", label: "Canadian employer reference letters", note: "12 months full-time (or part-time equivalent) in last 3 years", required: true },
          { id: "cec-work-t4", label: "T4 slips / NOAs from CRA", required: true },
          { id: "cec-work-noc", label: "NOC code confirmed (TEER 0, 1, 2, or 3)", required: true },
        ],
      },
      {
        title: "Education",
        items: [
          { id: "cec-edu", label: "Highest education credentials", note: "ECA required if claiming education points", required: false },
        ],
      },
      {
        title: "Other Documents",
        items: [
          { id: "cec-police", label: "Police clearance", required: true },
          { id: "cec-civil", label: "Civil status documents (if applicable)", required: false },
        ],
      },
    ],
  },
  fst: {
    title: "Federal Skilled Trades (FST)",
    description: "Express Entry for qualified tradespeople",
    categories: [
      {
        title: "Identity & Travel Documents",
        items: [
          { id: "fst-passport", label: "Valid passport", required: true },
          { id: "fst-photos", label: "Digital photos", required: true },
        ],
      },
      {
        title: "Language Proficiency",
        items: [
          { id: "fst-lang", label: "IELTS / CELPIP results", note: "CLB 5 in speaking/listening; CLB 4 in reading/writing", required: true },
        ],
      },
      {
        title: "Trades Qualifications",
        items: [
          { id: "fst-cert", label: "Certificate of qualification / journeyperson certificate", required: true },
          { id: "fst-job-offer", label: "Job offer for 1 year OR qualification certificate", required: true },
          { id: "fst-exp", label: "Work experience letters (2 years in trade)", required: true },
          { id: "fst-noc", label: "NOC code (must be in eligible trades list)", required: true },
        ],
      },
      {
        title: "Other Documents",
        items: [
          { id: "fst-police", label: "Police clearance", required: true },
          { id: "fst-funds", label: "Proof of funds (if no job offer)", required: false },
        ],
      },
    ],
  },
  wp_closed: {
    title: "Work Permit (Employer-Specific)",
    description: "Closed work permit tied to a specific employer",
    categories: [
      {
        title: "Identity Documents",
        items: [
          { id: "wpc-passport", label: "Valid passport", required: true },
          { id: "wpc-photos", label: "Digital photos", required: true },
          { id: "wpc-visa", label: "Temporary resident visa (if required)", required: false },
        ],
      },
      {
        title: "Job Offer",
        items: [
          { id: "wpc-offer", label: "Signed job offer letter from Canadian employer", required: true },
          { id: "wpc-lmia", label: "LMIA approval letter (or LMIA exemption code)", required: true },
          { id: "wpc-lmia-num", label: "LMIA number", required: true },
        ],
      },
      {
        title: "Qualifications",
        items: [
          { id: "wpc-edu", label: "Education credentials relevant to the job", required: false },
          { id: "wpc-exp", label: "Work experience proof", required: false },
          { id: "wpc-lang", label: "Language test (if employer requires)", required: false },
        ],
      },
      {
        title: "Other",
        items: [
          { id: "wpc-police", label: "Police clearance (if required by employer / country)", required: false },
          { id: "wpc-medical", label: "Medical exam results (if required)", note: "Required for certain occupations or countries", required: false },
        ],
      },
    ],
  },
  study: {
    title: "Study Permit",
    description: "For international students accepted to a Canadian DLI",
    categories: [
      {
        title: "Identity Documents",
        items: [
          { id: "sp-passport", label: "Valid passport", required: true },
          { id: "sp-photos", label: "Digital photos", required: true },
        ],
      },
      {
        title: "Acceptance & Enrollment",
        items: [
          { id: "sp-loa", label: "Letter of Acceptance (LOA) from Designated Learning Institution", required: true },
          { id: "sp-paf", label: "Provincial Attestation Letter (PAL)", note: "Required since 2024 for most applicants", required: true },
        ],
      },
      {
        title: "Financial Proof",
        items: [
          { id: "sp-funds", label: "Proof of financial support (tuition + living costs)", note: "Must cover at least 1st year + CAD $10,000 for living", required: true },
          { id: "sp-bank", label: "Bank statements (last 4 months)", required: true },
          { id: "sp-sponsor", label: "Sponsor letter + their financial proof (if sponsored)", required: false },
        ],
      },
      {
        title: "Other Documents",
        items: [
          { id: "sp-edu", label: "Previous education transcripts and certificates", required: true },
          { id: "sp-lang", label: "Language test results (IELTS / CELPIP)", note: "Required by most institutions", required: false },
          { id: "sp-purpose", label: "Statement of purpose (why you want to study in Canada)", required: true },
          { id: "sp-ties", label: "Proof of ties to home country (intent to return)", required: false },
          { id: "sp-medical", label: "Medical exam (if required based on country/duration)", required: false },
        ],
      },
    ],
  },
  visitor: {
    title: "Visitor Visa (TRV)",
    description: "Temporary Resident Visa for tourism or visiting family",
    categories: [
      {
        title: "Identity Documents",
        items: [
          { id: "tv-passport", label: "Valid passport", note: "Valid for 6 months beyond intended stay", required: true },
          { id: "tv-photos", label: "Digital photos", required: true },
          { id: "tv-old-visas", label: "Previous visas / travel history", required: false },
        ],
      },
      {
        title: "Purpose of Visit",
        items: [
          { id: "tv-invite", label: "Invitation letter from host in Canada (if visiting family)", required: false },
          { id: "tv-hotel", label: "Hotel bookings or accommodation proof", required: false },
          { id: "tv-itinerary", label: "Travel itinerary", required: false },
        ],
      },
      {
        title: "Financial Proof",
        items: [
          { id: "tv-funds", label: "Bank statements (last 3–6 months)", required: true },
          { id: "tv-employment", label: "Employment letter or proof of income", required: true },
        ],
      },
      {
        title: "Ties to Home Country",
        items: [
          { id: "tv-employment-letter", label: "Employer letter with approved leave", required: false },
          { id: "tv-property", label: "Property ownership documents", required: false },
          { id: "tv-family-ties", label: "Family ties document (dependents, etc.)", required: false },
        ],
      },
    ],
  },
  spousal: {
    title: "Spousal Sponsorship",
    description: "Sponsor your spouse or common-law partner for Canadian PR",
    categories: [
      {
        title: "Sponsor Documents (Canadian)",
        items: [
          { id: "ss-sponsor-id", label: "Sponsor's Canadian citizenship / PR card", required: true },
          { id: "ss-sponsor-passport", label: "Sponsor's passport", required: true },
          { id: "ss-sponsor-income", label: "Sponsor's NOAs (last 3 years)", required: false },
          { id: "ss-sponsor-address", label: "Proof of address in Canada", required: true },
        ],
      },
      {
        title: "Sponsored Person Documents",
        items: [
          { id: "ss-sp-passport", label: "Sponsored person's valid passport", required: true },
          { id: "ss-sp-photos", label: "Digital photos", required: true },
          { id: "ss-sp-birth", label: "Birth certificate", required: true },
          { id: "ss-sp-police", label: "Police clearance certificates (all countries)", required: true },
          { id: "ss-sp-medical", label: "Medical exam results", required: true },
        ],
      },
      {
        title: "Relationship Proof",
        items: [
          { id: "ss-marriage", label: "Marriage certificate (if married)", required: true },
          { id: "ss-photos-together", label: "Photos together over time", required: true },
          { id: "ss-communication", label: "Communication records (messages, emails, calls)", required: true },
          { id: "ss-financial-ties", label: "Joint financial records (accounts, bills, lease)", required: false },
          { id: "ss-travel", label: "Travel records showing visits", required: false },
        ],
      },
    ],
  },
  pnp: {
    title: "Provincial Nominee Program (PNP)",
    description: "Province-specific immigration streams",
    categories: [
      {
        title: "Identity Documents",
        items: [
          { id: "pnp-passport", label: "Valid passport", required: true },
          { id: "pnp-photos", label: "Digital photos", required: true },
          { id: "pnp-status", label: "Current immigration status (if in Canada)", required: false },
        ],
      },
      {
        title: "Provincial Nomination",
        items: [
          { id: "pnp-certificate", label: "Provincial Nomination Certificate (PNC)", note: "From provincial immigration authority", required: true },
          { id: "pnp-approval", label: "PNP approval letter", required: true },
        ],
      },
      {
        title: "Language & Education",
        items: [
          { id: "pnp-lang", label: "Language test results (as required by province)", required: false },
          { id: "pnp-edu", label: "Education credentials + ECA (if applicable)", required: false },
        ],
      },
      {
        title: "Work Experience & Job",
        items: [
          { id: "pnp-work", label: "Work experience letters", required: false },
          { id: "pnp-job-offer", label: "Job offer letter from provincial employer", note: "Required for most employer-tied streams", required: false },
        ],
      },
      {
        title: "Other",
        items: [
          { id: "pnp-police", label: "Police clearance certificates", required: true },
          { id: "pnp-medical", label: "Medical exam results", required: true },
          { id: "pnp-funds", label: "Proof of funds (if required by stream)", required: false },
        ],
      },
    ],
  },
};

const VISA_OPTIONS = [
  { value: "", label: "Select visa / immigration type..." },
  { value: "fsw", label: "Express Entry — Federal Skilled Worker (FSW)" },
  { value: "cec", label: "Express Entry — Canadian Experience Class (CEC)" },
  { value: "fst", label: "Express Entry — Federal Skilled Trades (FST)" },
  { value: "wp_closed", label: "Work Permit (Employer-Specific)" },
  { value: "study", label: "Study Permit" },
  { value: "visitor", label: "Visitor Visa (TRV)" },
  { value: "spousal", label: "Spousal / Common-Law Sponsorship" },
  { value: "pnp", label: "Provincial Nominee Program (PNP)" },
];

const STORAGE_KEY = "ircc_checklist_";

export default function ChecklistPage() {
  const [visaType, setVisaType] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visaType) {
      const saved = localStorage.getItem(STORAGE_KEY + visaType);
      setChecked(saved ? JSON.parse(saved) : {});
    }
  }, [visaType]);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    if (visaType) localStorage.setItem(STORAGE_KEY + visaType, JSON.stringify(next));
  }

  const checklist = visaType ? CHECKLISTS[visaType] : null;
  const allItems = checklist?.categories.flatMap(c => c.items) ?? [];
  const requiredItems = allItems.filter(i => i.required);
  const checkedRequired = requiredItems.filter(i => checked[i.id]).length;
  const checkedTotal = allItems.filter(i => checked[i.id]).length;
  const progress = requiredItems.length > 0 ? Math.round((checkedRequired / requiredItems.length) * 100) : 0;

  return (
    <PageLayout activeNav="checklist" subtitle="Document Checklist">
      <div className="max-w-2xl mx-auto">
        <div className="canada-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📋</span>
            <div>
              <h2 className="text-xl font-bold text-white">Document Checklist</h2>
              <p className="text-sm text-gray-400">Know exactly what documents you need — your progress is saved</p>
            </div>
          </div>
        </div>

        {/* Visa type selector */}
        <div className="canada-card p-4 mb-4">
          <select
            value={visaType}
            onChange={(e) => setVisaType(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {VISA_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {checklist && (
          <>
            {/* Progress */}
            <div className="canada-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white font-semibold">{checklist.title}</p>
                <p className="text-xs text-gray-400">{checkedTotal} / {allItems.length} collected</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">{checklist.description}</p>
              <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${progress}%`, background: progress === 100 ? "#4ade80" : "linear-gradient(90deg,#d52b1e,#a01208)" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{checkedRequired}/{requiredItems.length} required documents collected</p>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {checklist.categories.map((cat) => (
                <div key={cat.title} className="canada-card p-4">
                  <p className="text-sm font-semibold text-white mb-3">{cat.title}</p>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 cursor-pointer group"
                        onClick={() => toggle(item.id)}
                      >
                        <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                          style={{
                            background: checked[item.id] ? "#4ade80" : "rgba(255,255,255,0.06)",
                            border: checked[item.id] ? "none" : "1px solid rgba(255,255,255,0.15)",
                          }}>
                          {checked[item.id] && <span className="text-black text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm ${checked[item.id] ? "line-through text-gray-500" : "text-white"}`}>
                              {item.label}
                            </span>
                            {item.required && (
                              <span className="text-xs text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded-full flex-shrink-0">Required</span>
                            )}
                          </div>
                          {item.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {progress === 100 && (
              <div className="canada-card p-4 mt-4 text-center" style={{ borderColor: "rgba(74,222,128,0.3)" }}>
                <p className="text-green-400 font-semibold text-sm">All required documents collected!</p>
                <p className="text-xs text-gray-500 mt-1">Double-check each document is current and properly certified before applying.</p>
              </div>
            )}

            <button
              onClick={() => {
                if (visaType) { localStorage.removeItem(STORAGE_KEY + visaType); setChecked({}); }
              }}
              className="mt-3 w-full text-xs text-gray-600 py-2 hover:text-gray-400 transition-colors"
            >
              Reset checklist
            </button>
          </>
        )}

        {!checklist && (
          <div className="canada-card p-8 text-center">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-white font-semibold mb-1">Select a visa type above</p>
            <p className="text-sm text-gray-500">Get a personalized list of required documents</p>
          </div>
        )}

        {/* Cross-tool */}
        <div className="canada-next-step mt-6">
          <div>
            <p className="text-sm font-semibold text-white">Find your immigration pathway first</p>
            <p className="text-xs text-gray-400 mt-0.5">Answer 8 questions to see which stream fits you</p>
          </div>
          <a href="/pathway" className="canada-btn text-xs px-4 py-2 flex-shrink-0" style={{ textDecoration: "none" }}>
            Pathway Finder →
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
