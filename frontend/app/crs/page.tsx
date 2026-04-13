"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type EducationLevel =
  | "less_than_secondary"
  | "secondary"
  | "one_year_diploma"
  | "two_year_diploma"
  | "bachelors_or_3yr"
  | "two_or_more_certs"
  | "masters"
  | "doctoral";

type CLBScores = {
  reading: number;
  writing: number;
  listening: number;
  speaking: number;
};

type FormState = {
  age: number;
  education: EducationLevel;
  firstLangCLB: CLBScores;
  secondLangCLB: CLBScores;
  hasSecondLang: boolean;
  canadianWorkExp: number; // years: 0,1,2,3,4,5
  hasSpouse: boolean;
  spouseEducation: EducationLevel;
  spouseLangCLB: CLBScores;
  spouseCanadianWorkExp: number;
  foreignWorkExp: number; // 0, 1, 2, 3+ (stored as 0/1/2/3)
  provincialNomination: boolean;
  jobOfferType: "none" | "noc00" | "other_noc";
  canadianEducation: "none" | "one_two_yr" | "three_plus_yr";
  hasSiblingInCanada: boolean;
  frenchSkills: "none" | "clb7_plus_english_clb4" | "clb7_plus_no_english";
  // Skill transferability combos
  educationPlusForeignWork: boolean;
  foreignWorkPlusCanadianWork: boolean;
};

// ─── CRS Scoring Tables ───────────────────────────────────────────────────────

// Table 1: Age — with spouse / without spouse
const AGE_SCORES_NO_SPOUSE: Record<string, number> = {
  "17_or_less": 0, "18": 99, "19": 105, "20": 110, "21": 110, "22": 110,
  "23": 110, "24": 110, "25": 110, "26": 110, "27": 110, "28": 110,
  "29": 110, "30": 105, "31": 99, "32": 94, "33": 88, "34": 83,
  "35": 77, "36": 72, "37": 66, "38": 61, "39": 55, "40": 50,
  "41": 39, "42": 28, "43": 17, "44": 6, "45_or_more": 0,
};

const AGE_SCORES_WITH_SPOUSE: Record<string, number> = {
  "17_or_less": 0, "18": 90, "19": 95, "20": 100, "21": 100, "22": 100,
  "23": 100, "24": 100, "25": 100, "26": 100, "27": 100, "28": 100,
  "29": 100, "30": 95, "31": 90, "32": 85, "33": 80, "34": 75,
  "35": 70, "36": 65, "37": 60, "38": 55, "39": 50, "40": 45,
  "41": 35, "42": 25, "43": 15, "44": 5, "45_or_more": 0,
};

function getAgeKey(age: number): string {
  if (age <= 17) return "17_or_less";
  if (age >= 45) return "45_or_more";
  return String(age);
}

// Table 2: Education — with spouse / without spouse
const EDUCATION_SCORES_NO_SPOUSE: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 28,
  one_year_diploma: 84,
  two_year_diploma: 91,
  bachelors_or_3yr: 112,
  two_or_more_certs: 119,
  masters: 126,
  doctoral: 140,
};

const EDUCATION_SCORES_WITH_SPOUSE: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 25,
  one_year_diploma: 68,
  two_year_diploma: 78,
  bachelors_or_3yr: 84,
  two_or_more_certs: 91,
  masters: 112,
  doctoral: 119,
};

// Table 3: First official language — without spouse (CLB → points per skill)
// Each skill scored separately, then summed
const FIRST_LANG_NO_SPOUSE: Record<number, number> = {
  4: 6, 5: 6, 6: 9, 7: 17, 8: 23, 9: 31, 10: 34,
};
const FIRST_LANG_WITH_SPOUSE: Record<number, number> = {
  4: 6, 5: 6, 6: 8, 7: 16, 8: 22, 9: 29, 10: 32,
};

// Table 4: Second official language — same for both (capped at CLB 5+)
const SECOND_LANG_SCORES: Record<number, number> = {
  4: 0, 5: 1, 6: 1, 7: 3, 8: 3, 9: 6, 10: 6,
};

// Table 5: Canadian work experience — without / with spouse
const CANADIAN_WORK_NO_SPOUSE: Record<number, number> = {
  0: 0, 1: 40, 2: 53, 3: 64, 4: 72, 5: 80,
};
const CANADIAN_WORK_WITH_SPOUSE: Record<number, number> = {
  0: 0, 1: 35, 2: 46, 3: 56, 4: 63, 5: 70,
};

// Spouse factors
const SPOUSE_EDUCATION_SCORES: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 2,
  one_year_diploma: 6,
  two_year_diploma: 7,
  bachelors_or_3yr: 8,
  two_or_more_certs: 9,
  masters: 10,
  doctoral: 10,
};

const SPOUSE_LANG_SCORES: Record<number, number> = {
  4: 0, 5: 1, 6: 1, 7: 3, 8: 3, 9: 5, 10: 5,
};

const SPOUSE_CANADIAN_WORK_SCORES: Record<number, number> = {
  0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10,
};

// ─── Skill Transferability ─────────────────────────────────────────────────────
// Education + language (first lang CLB 7+)
// Each point level below applies: doctoral=50, masters=50, bachelors=50, 2yr=25, 1yr=25
// With CLB 9+: doctoral=50, masters=50, bachelors=50, 2yr=50, 1yr=50 (max 50)
function getEducationPlusLangPoints(
  education: EducationLevel,
  firstLangCLB: CLBScores
): number {
  const minCLB = Math.min(
    firstLangCLB.reading,
    firstLangCLB.writing,
    firstLangCLB.listening,
    firstLangCLB.speaking
  );
  if (minCLB < 7) return 0;

  const qualifyingEdu: EducationLevel[] = [
    "one_year_diploma", "two_year_diploma", "bachelors_or_3yr",
    "two_or_more_certs", "masters", "doctoral",
  ];
  if (!qualifyingEdu.includes(education)) return 0;

  const highEdu: EducationLevel[] = ["bachelors_or_3yr", "two_or_more_certs", "masters", "doctoral"];
  const isHighEdu = highEdu.includes(education);

  if (minCLB >= 9) {
    return isHighEdu ? 50 : 25;
  }
  // CLB 7 or 8
  return isHighEdu ? 25 : 13;
}

// Education + Canadian work experience
function getEducationPlusCanadianWorkPoints(
  education: EducationLevel,
  canadianWorkExp: number
): number {
  if (canadianWorkExp === 0) return 0;
  const qualifyingEdu: EducationLevel[] = [
    "one_year_diploma", "two_year_diploma", "bachelors_or_3yr",
    "two_or_more_certs", "masters", "doctoral",
  ];
  if (!qualifyingEdu.includes(education)) return 0;
  const highEdu: EducationLevel[] = ["bachelors_or_3yr", "two_or_more_certs", "masters", "doctoral"];
  const isHighEdu = highEdu.includes(education);
  if (canadianWorkExp >= 2) return isHighEdu ? 50 : 25;
  return isHighEdu ? 25 : 13;
}

// Foreign work + language
function getForeignWorkPlusLangPoints(
  foreignWorkExp: number,
  firstLangCLB: CLBScores
): number {
  if (foreignWorkExp === 0) return 0;
  const minCLB = Math.min(
    firstLangCLB.reading,
    firstLangCLB.writing,
    firstLangCLB.listening,
    firstLangCLB.speaking
  );
  if (minCLB < 7) return 0;
  if (foreignWorkExp >= 3) return minCLB >= 9 ? 50 : 25;
  // 1-2 years
  return minCLB >= 9 ? 25 : 13;
}

// Foreign work + Canadian work
function getForeignPlusCanadianWorkPoints(
  foreignWorkExp: number,
  canadianWorkExp: number
): number {
  if (foreignWorkExp === 0 || canadianWorkExp === 0) return 0;
  if (foreignWorkExp >= 3 && canadianWorkExp >= 2) return 50;
  if (foreignWorkExp >= 3 || canadianWorkExp >= 2) return 25;
  return 13;
}

// ─── CLB conversion helper text ───────────────────────────────────────────────
function clbLabel(clb: number): string {
  if (clb <= 4) return "CLB 4";
  if (clb >= 10) return "CLB 10+";
  return `CLB ${clb}`;
}

function getLangScoreForCLB(clb: number, table: Record<number, number>): number {
  const capped = Math.min(Math.max(clb, 4), 10);
  return table[capped] ?? 0;
}

// ─── Main CRS Calculator ──────────────────────────────────────────────────────

const LATEST_CUTOFF = 477;

function calcCRS(form: FormState): {
  total: number;
  breakdown: {
    coreHumanCapital: number;
    spouseFactors: number;
    skillTransferability: number;
    additionalPoints: number;
    details: Record<string, number>;
  };
} {
  const hasSpouse = form.hasSpouse;

  // ── A. Core Human Capital ──
  const ageTable = hasSpouse ? AGE_SCORES_WITH_SPOUSE : AGE_SCORES_NO_SPOUSE;
  const ageScore = ageTable[getAgeKey(form.age)] ?? 0;

  const eduTable = hasSpouse ? EDUCATION_SCORES_WITH_SPOUSE : EDUCATION_SCORES_NO_SPOUSE;
  const educationScore = eduTable[form.education];

  const langTable = hasSpouse ? FIRST_LANG_WITH_SPOUSE : FIRST_LANG_NO_SPOUSE;
  const firstLangScore =
    getLangScoreForCLB(form.firstLangCLB.reading, langTable) +
    getLangScoreForCLB(form.firstLangCLB.writing, langTable) +
    getLangScoreForCLB(form.firstLangCLB.listening, langTable) +
    getLangScoreForCLB(form.firstLangCLB.speaking, langTable);

  let secondLangScore = 0;
  if (form.hasSecondLang) {
    secondLangScore =
      getLangScoreForCLB(form.secondLangCLB.reading, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLangCLB.writing, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLangCLB.listening, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLangCLB.speaking, SECOND_LANG_SCORES);
    secondLangScore = Math.min(secondLangScore, 24);
  }

  const canadianWorkTable = hasSpouse ? CANADIAN_WORK_WITH_SPOUSE : CANADIAN_WORK_NO_SPOUSE;
  const canadianWorkScore = canadianWorkTable[Math.min(form.canadianWorkExp, 5)] ?? 0;

  const coreHumanCapital = ageScore + educationScore + firstLangScore + secondLangScore + canadianWorkScore;

  // ── B. Spouse Factors ──
  let spouseEducationScore = 0;
  let spouseLangScore = 0;
  let spouseWorkScore = 0;
  if (hasSpouse) {
    spouseEducationScore = SPOUSE_EDUCATION_SCORES[form.spouseEducation];
    spouseLangScore =
      getLangScoreForCLB(form.spouseLangCLB.reading, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLangCLB.writing, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLangCLB.listening, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLangCLB.speaking, SPOUSE_LANG_SCORES);
    spouseWorkScore = SPOUSE_CANADIAN_WORK_SCORES[Math.min(form.spouseCanadianWorkExp, 5)] ?? 0;
  }
  const spouseFactors = spouseEducationScore + spouseLangScore + spouseWorkScore;

  // ── C. Skill Transferability (max 100 pts) ──
  const eduLangPts = getEducationPlusLangPoints(form.education, form.firstLangCLB);
  const eduWorkPts = getEducationPlusCanadianWorkPoints(form.education, form.canadianWorkExp);
  const foreignLangPts = getForeignWorkPlusLangPoints(form.foreignWorkExp, form.firstLangCLB);
  const foreignCanadianPts = getForeignPlusCanadianWorkPoints(form.foreignWorkExp, form.canadianWorkExp);

  const skillTransferabilityRaw = eduLangPts + eduWorkPts + foreignLangPts + foreignCanadianPts;
  const skillTransferability = Math.min(skillTransferabilityRaw, 100);

  // ── D. Additional Points ──
  const provincialNominationPts = form.provincialNomination ? 600 : 0;
  const jobOfferPts =
    form.jobOfferType === "noc00" ? 200 : form.jobOfferType === "other_noc" ? 50 : 0;
  const canadianEduPts =
    form.canadianEducation === "one_two_yr" ? 15 : form.canadianEducation === "three_plus_yr" ? 30 : 0;
  const siblingPts = form.hasSiblingInCanada ? 15 : 0;
  let frenchPts = 0;
  if (form.frenchSkills === "clb7_plus_english_clb4") frenchPts = 15;
  else if (form.frenchSkills === "clb7_plus_no_english") frenchPts = 30;

  const additionalPoints =
    provincialNominationPts + jobOfferPts + canadianEduPts + siblingPts + frenchPts;

  const total = coreHumanCapital + spouseFactors + skillTransferability + additionalPoints;

  return {
    total,
    breakdown: {
      coreHumanCapital,
      spouseFactors,
      skillTransferability,
      additionalPoints,
      details: {
        age: ageScore,
        education: educationScore,
        firstLanguage: firstLangScore,
        secondLanguage: secondLangScore,
        canadianWork: canadianWorkScore,
        spouseEducation: spouseEducationScore,
        spouseLanguage: spouseLangScore,
        spouseWork: spouseWorkScore,
        eduPlusLang: eduLangPts,
        eduPlusWork: eduWorkPts,
        foreignPlusLang: foreignLangPts,
        foreignPlusCanadian: foreignCanadianPts,
        provincial: provincialNominationPts,
        jobOffer: jobOfferPts,
        canadianEdu: canadianEduPts,
        sibling: siblingPts,
        french: frenchPts,
      },
    },
  };
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultCLB: CLBScores = { reading: 7, writing: 7, listening: 7, speaking: 7 };

const defaultForm: FormState = {
  age: 28,
  education: "bachelors_or_3yr",
  firstLangCLB: { ...defaultCLB },
  secondLangCLB: { reading: 4, writing: 4, listening: 4, speaking: 4 },
  hasSecondLang: false,
  canadianWorkExp: 0,
  hasSpouse: false,
  spouseEducation: "bachelors_or_3yr",
  spouseLangCLB: { reading: 4, writing: 4, listening: 4, speaking: 4 },
  spouseCanadianWorkExp: 0,
  foreignWorkExp: 0,
  provincialNomination: false,
  jobOfferType: "none",
  canadianEducation: "none",
  hasSiblingInCanada: false,
  frenchSkills: "none",
  educationPlusForeignWork: false,
  foreignWorkPlusCanadianWork: false,
};

// ─── Sub-components (inline) ─────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="canada-card p-6 space-y-4">
      <h2 className="section-title text-base font-semibold uppercase tracking-wide text-red-400">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {children}
    </label>
  );
}

function CLBRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CLBScores;
  onChange: (v: CLBScores) => void;
}) {
  const skills: (keyof CLBScores)[] = ["reading", "writing", "listening", "speaking"];
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {skills.map((skill) => (
          <div key={skill}>
            <p className="text-xs text-gray-500 capitalize mb-1">{skill}</p>
            <select
              value={value[skill]}
              onChange={(e) =>
                onChange({ ...value, [skill]: Number(e.target.value) })
              }
              className="canada-input text-sm py-1.5"
            >
              {[4, 5, 6, 7, 8, 9, 10].map((clb) => (
                <option key={clb} value={clb}>
                  {clbLabel(clb)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-red-600" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}

function ScoreBar({
  label,
  value,
  max,
  color = "bg-red-500",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CRSCalculatorPage() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const result = useMemo(() => calcCRS(form), [form]);
  const { total, breakdown } = result;

  const pointsNeeded = Math.max(0, LATEST_CUTOFF - total);
  const scoreColor =
    total >= 470
      ? { ring: "ring-green-500", text: "text-green-400", badge: "bg-green-900/40 text-green-300 border-green-700" }
      : total >= 400
      ? { ring: "ring-yellow-500", text: "text-yellow-400", badge: "bg-yellow-900/40 text-yellow-300 border-yellow-700" }
      : { ring: "ring-red-500", text: "text-red-400", badge: "bg-red-900/40 text-red-300 border-red-700" };

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAlertSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!alertEmail) return;
    setAlertLoading(true);
    await supabase.from("alert_subscriptions").insert({
      email: alertEmail,
      visa_type: "crs_calculator",
      country_code: "CAN",
    });
    setAlertSubmitted(true);
    setAlertLoading(false);
  }

  return (
    <div className="canada-bg text-white">
      {/* Header */}
      <header className="canada-header px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🍁 IRCC Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">CRS Score Calculator</p>
        </div>
        <nav className="flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            Processing Times
          </a>
          <a href="/draws" className="text-gray-400 hover:text-white text-sm transition-colors">
            PR Draws
          </a>
          <span className="canada-pill active text-xs">CRS Calc</span>
        </nav>
      </header>

      <div className="canada-topbar" />

      <main
        className="max-w-6xl mx-auto px-4 py-8 space-y-6"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Comprehensive Ranking System (CRS) Calculator
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Estimate your Express Entry CRS score based on the official IRCC formula.
            Score updates live as you fill in the form.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Core Human Capital */}
            <SectionCard title="Core Human Capital Factors">

              {/* Age */}
              <div>
                <Label>Age</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={17}
                    max={47}
                    value={form.age}
                    onChange={(e) => set("age", Number(e.target.value))}
                    className="flex-1 accent-red-500"
                  />
                  <span className="w-16 text-center canada-card px-2 py-1 text-sm font-mono font-bold text-white rounded-lg">
                    {form.age >= 45 ? "45+" : form.age <= 17 ? "≤17" : form.age}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Points: <span className="text-white font-semibold">{breakdown.details.age}</span>
                  {" "}(max {form.hasSpouse ? 100 : 110})
                </p>
              </div>

              {/* Education */}
              <div>
                <Label>Education Level</Label>
                <select
                  value={form.education}
                  onChange={(e) => set("education", e.target.value as EducationLevel)}
                  className="canada-input"
                >
                  <option value="less_than_secondary">Less than secondary school</option>
                  <option value="secondary">Secondary diploma (high school)</option>
                  <option value="one_year_diploma">One-year post-secondary diploma / certificate</option>
                  <option value="two_year_diploma">Two-year post-secondary diploma / certificate</option>
                  <option value="bachelors_or_3yr">Bachelor's degree or 3-year program</option>
                  <option value="two_or_more_certs">Two or more post-secondary credentials</option>
                  <option value="masters">Master's degree</option>
                  <option value="doctoral">Doctoral (PhD)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Points: <span className="text-white font-semibold">{breakdown.details.education}</span>
                </p>
              </div>

              {/* First language */}
              <CLBRow
                label="First Official Language (English or French) — CLB score per skill"
                value={form.firstLangCLB}
                onChange={(v) => set("firstLangCLB", v)}
              />
              <p className="text-xs text-gray-500 -mt-2">
                Total language points: <span className="text-white font-semibold">{breakdown.details.firstLanguage}</span>
                {" "}(max {form.hasSpouse ? 128 : 136})
              </p>

              {/* Second language toggle */}
              <Toggle
                checked={form.hasSecondLang}
                onChange={(v) => set("hasSecondLang", v)}
                label="I have scores in a second official language"
              />

              {form.hasSecondLang && (
                <>
                  <CLBRow
                    label="Second Official Language — CLB score per skill"
                    value={form.secondLangCLB}
                    onChange={(v) => set("secondLangCLB", v)}
                  />
                  <p className="text-xs text-gray-500 -mt-2">
                    Points: <span className="text-white font-semibold">{breakdown.details.secondLanguage}</span>
                    {" "}(max 24)
                  </p>
                </>
              )}

              {/* Canadian work experience */}
              <div>
                <Label>Canadian Work Experience</Label>
                <select
                  value={form.canadianWorkExp}
                  onChange={(e) => set("canadianWorkExp", Number(e.target.value))}
                  className="canada-input"
                >
                  <option value={0}>None</option>
                  <option value={1}>1 year</option>
                  <option value={2}>2 years</option>
                  <option value={3}>3 years</option>
                  <option value={4}>4 years</option>
                  <option value={5}>5+ years</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Points: <span className="text-white font-semibold">{breakdown.details.canadianWork}</span>
                  {" "}(max {form.hasSpouse ? 70 : 80})
                </p>
              </div>
            </SectionCard>

            {/* Spouse / Partner */}
            <SectionCard title="Spouse / Common-Law Partner Factors">
              <Toggle
                checked={form.hasSpouse}
                onChange={(v) => set("hasSpouse", v)}
                label="My spouse or common-law partner will accompany me to Canada"
              />

              {form.hasSpouse && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <p className="text-xs text-gray-500">
                    Having a spouse reduces your core factors slightly but adds separate spouse points.
                  </p>

                  <div>
                    <Label>Spouse's Education Level</Label>
                    <select
                      value={form.spouseEducation}
                      onChange={(e) => set("spouseEducation", e.target.value as EducationLevel)}
                      className="canada-input"
                    >
                      <option value="less_than_secondary">Less than secondary school</option>
                      <option value="secondary">Secondary diploma</option>
                      <option value="one_year_diploma">One-year post-secondary</option>
                      <option value="two_year_diploma">Two-year post-secondary</option>
                      <option value="bachelors_or_3yr">Bachelor's / 3-year program</option>
                      <option value="two_or_more_certs">Two or more credentials</option>
                      <option value="masters">Master's degree</option>
                      <option value="doctoral">Doctoral (PhD)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Points: <span className="text-white font-semibold">{breakdown.details.spouseEducation}</span>
                    </p>
                  </div>

                  <CLBRow
                    label="Spouse's First Official Language — CLB score per skill"
                    value={form.spouseLangCLB}
                    onChange={(v) => set("spouseLangCLB", v)}
                  />
                  <p className="text-xs text-gray-500 -mt-2">
                    Spouse language points: <span className="text-white font-semibold">{breakdown.details.spouseLanguage}</span>
                    {" "}(max 20)
                  </p>

                  <div>
                    <Label>Spouse's Canadian Work Experience</Label>
                    <select
                      value={form.spouseCanadianWorkExp}
                      onChange={(e) => set("spouseCanadianWorkExp", Number(e.target.value))}
                      className="canada-input"
                    >
                      <option value={0}>None</option>
                      <option value={1}>1 year</option>
                      <option value={2}>2 years</option>
                      <option value={3}>3 years</option>
                      <option value={4}>4 years</option>
                      <option value={5}>5+ years</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Points: <span className="text-white font-semibold">{breakdown.details.spouseWork}</span>
                      {" "}(max 10)
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Skill Transferability */}
            <SectionCard title="Skill Transferability Factors">
              <p className="text-xs text-gray-500 -mt-1">
                Combinations of education, foreign work, and language skills — capped at 100 pts total.
              </p>

              <div>
                <Label>Foreign Work Experience (outside Canada)</Label>
                <select
                  value={form.foreignWorkExp}
                  onChange={(e) => set("foreignWorkExp", Number(e.target.value))}
                  className="canada-input"
                >
                  <option value={0}>None</option>
                  <option value={1}>1–2 years</option>
                  <option value={3}>3 or more years</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="canada-card p-3 space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Education + Language</p>
                  <p className="text-2xl font-bold text-white">{breakdown.details.eduPlusLang}</p>
                  <p className="text-xs text-gray-500">
                    {form.education !== "less_than_secondary" && form.education !== "secondary"
                      ? "Post-secondary edu + CLB 7+ in all abilities"
                      : "Requires post-secondary education"}
                  </p>
                </div>
                <div className="canada-card p-3 space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Education + Canadian Work</p>
                  <p className="text-2xl font-bold text-white">{breakdown.details.eduPlusWork}</p>
                  <p className="text-xs text-gray-500">Post-secondary edu + Canadian work exp</p>
                </div>
                <div className="canada-card p-3 space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Foreign Work + Language</p>
                  <p className="text-2xl font-bold text-white">{breakdown.details.foreignPlusLang}</p>
                  <p className="text-xs text-gray-500">Foreign work exp + CLB 7+ in all abilities</p>
                </div>
                <div className="canada-card p-3 space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Foreign + Canadian Work</p>
                  <p className="text-2xl font-bold text-white">{breakdown.details.foreignPlusCanadian}</p>
                  <p className="text-xs text-gray-500">Foreign work exp + Canadian work exp</p>
                </div>
              </div>
            </SectionCard>

            {/* Additional Points */}
            <SectionCard title="Additional Points">

              {/* Provincial Nomination */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Provincial Nomination (PNP)</p>
                  <p className="text-xs text-gray-500">+600 points — virtually guarantees invitation</p>
                </div>
                <Toggle
                  checked={form.provincialNomination}
                  onChange={(v) => set("provincialNomination", v)}
                  label=""
                />
              </div>

              {/* Job Offer */}
              <div>
                <Label>Valid Job Offer</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "none", label: "No job offer", pts: "0 pts" },
                    { val: "noc00", label: "NOC TEER 0 (senior mgmt)", pts: "+200 pts" },
                    { val: "other_noc", label: "Other valid NOC", pts: "+50 pts" },
                  ].map(({ val, label, pts }) => (
                    <button
                      key={val}
                      onClick={() => set("jobOfferType", val as FormState["jobOfferType"])}
                      className={`canada-pill ${form.jobOfferType === val ? "active" : ""} text-xs`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canadian Education */}
              <div>
                <Label>Canadian Education (studied in Canada)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "none", label: "None", pts: "0 pts" },
                    { val: "one_two_yr", label: "1–2 year program", pts: "+15 pts" },
                    { val: "three_plus_yr", label: "3+ year program", pts: "+30 pts" },
                  ].map(({ val, label, pts }) => (
                    <button
                      key={val}
                      onClick={() => set("canadianEducation", val as FormState["canadianEducation"])}
                      className={`canada-pill ${form.canadianEducation === val ? "active" : ""} text-xs`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sibling */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Sibling living in Canada</p>
                  <p className="text-xs text-gray-500">+15 points — brother or sister who is a citizen or PR</p>
                </div>
                <Toggle
                  checked={form.hasSiblingInCanada}
                  onChange={(v) => set("hasSiblingInCanada", v)}
                  label=""
                />
              </div>

              {/* French */}
              <div>
                <Label>French Language Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "none", label: "No French / below CLB 7", pts: "0 pts" },
                    { val: "clb7_plus_english_clb4", label: "CLB 7+ French + strong English", pts: "+15 pts" },
                    { val: "clb7_plus_no_english", label: "CLB 7+ French only (no strong English)", pts: "+30 pts" },
                  ].map(({ val, label, pts }) => (
                    <button
                      key={val}
                      onClick={() => set("frenchSkills", val as FormState["frenchSkills"])}
                      className={`canada-pill ${form.frenchSkills === val ? "active" : ""} text-xs`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Right: Score Panel ── */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Main Score Card */}
              <div className={`stat-card ring-2 ${scoreColor.ring} text-center`}>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Your Estimated CRS Score
                </p>
                <p className={`text-7xl font-black tracking-tight ${scoreColor.text}`}>
                  {total}
                </p>
                <p className="text-xs text-gray-500 mt-1">out of 1,200</p>

                <div className={`mt-4 px-3 py-2 rounded-lg border text-sm font-medium ${scoreColor.badge}`}>
                  {total >= 470
                    ? "Strong profile — competitive for most draws"
                    : total >= 400
                    ? "Moderate profile — watch draws closely"
                    : "Building profile — focus on improving factors"}
                </div>
              </div>

              {/* Latest cutoff comparison */}
              <div className="canada-card p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                  Latest Cutoff Comparison
                </p>
                <p className="text-sm text-gray-300">
                  Latest Federal draw cutoff:{" "}
                  <span className="font-bold text-white">{LATEST_CUTOFF}</span>
                </p>
                {pointsNeeded === 0 ? (
                  <p className="text-sm text-green-400 font-semibold mt-1">
                    You meet or exceed the latest cutoff!
                  </p>
                ) : (
                  <p className="text-sm text-yellow-400 mt-1">
                    You need{" "}
                    <span className="font-bold text-white">{pointsNeeded}</span>{" "}
                    more points to match the latest cutoff.
                  </p>
                )}
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      total >= LATEST_CUTOFF ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${Math.min((total / LATEST_CUTOFF) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round((total / LATEST_CUTOFF) * 100)}% of cutoff score
                </p>
              </div>

              {/* Score breakdown */}
              <div className="canada-card p-4 space-y-3">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Score Breakdown
                </p>
                <ScoreBar
                  label="Core Human Capital"
                  value={breakdown.coreHumanCapital}
                  max={form.hasSpouse ? 460 : 500}
                  color="bg-red-500"
                />
                {form.hasSpouse && (
                  <ScoreBar
                    label="Spouse / Partner Factors"
                    value={breakdown.spouseFactors}
                    max={40}
                    color="bg-orange-500"
                  />
                )}
                <ScoreBar
                  label="Skill Transferability"
                  value={breakdown.skillTransferability}
                  max={100}
                  color="bg-yellow-500"
                />
                <ScoreBar
                  label="Additional Points"
                  value={breakdown.additionalPoints}
                  max={600}
                  color="bg-green-500"
                />

                <div className="pt-2 border-t border-white/5 space-y-1">
                  {[
                    { label: "Age", val: breakdown.details.age },
                    { label: "Education", val: breakdown.details.education },
                    { label: "First language", val: breakdown.details.firstLanguage },
                    ...(form.hasSecondLang ? [{ label: "Second language", val: breakdown.details.secondLanguage }] : []),
                    { label: "Canadian work exp.", val: breakdown.details.canadianWork },
                    ...(form.hasSpouse ? [
                      { label: "Spouse education", val: breakdown.details.spouseEducation },
                      { label: "Spouse language", val: breakdown.details.spouseLanguage },
                      { label: "Spouse work exp.", val: breakdown.details.spouseWork },
                    ] : []),
                    { label: "Skill transferability", val: breakdown.skillTransferability },
                    ...(breakdown.details.provincial > 0 ? [{ label: "Provincial nomination", val: breakdown.details.provincial }] : []),
                    ...(breakdown.details.jobOffer > 0 ? [{ label: "Job offer", val: breakdown.details.jobOffer }] : []),
                    ...(breakdown.details.canadianEdu > 0 ? [{ label: "Canadian education", val: breakdown.details.canadianEdu }] : []),
                    ...(breakdown.details.sibling > 0 ? [{ label: "Sibling in Canada", val: breakdown.details.sibling }] : []),
                    ...(breakdown.details.french > 0 ? [{ label: "French bonus", val: breakdown.details.french }] : []),
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-xs text-gray-400">
                      <span>{label}</span>
                      <span className="font-semibold text-white">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Total CRS</span>
                    <span className={scoreColor.text}>{total}</span>
                  </div>
                </div>
              </div>

              {/* Score Legend */}
              <div className="canada-card p-4 space-y-2">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Score Guide</p>
                {[
                  { range: "470+", label: "Competitive for most draws", color: "bg-green-500" },
                  { range: "400–469", label: "Watch draws closely", color: "bg-yellow-500" },
                  { range: "< 400", label: "Focus on improving profile", color: "bg-red-500" },
                ].map(({ range, label, color }) => (
                  <div key={range} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
                    <span className="font-semibold text-white w-16">{range}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Signup CTA */}
        <div className="canada-card p-6">
          <h2 className="section-title mb-1">Get Notified When Draw Cutoffs Drop</h2>
          <p className="text-sm text-gray-400 mb-4">
            Sign up for free email alerts when a new Express Entry draw is announced.
            We&apos;ll tell you instantly — so you don&apos;t miss your window.
          </p>

          {alertSubmitted ? (
            <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
              You&apos;re on the list! We&apos;ll email you the moment a new draw is announced.
            </div>
          ) : (
            <form onSubmit={handleAlertSignup} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="email"
                placeholder="your@email.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                required
                className="canada-input flex-1"
              />
              <button
                type="submit"
                disabled={alertLoading}
                className="canada-btn whitespace-nowrap disabled:opacity-60"
              >
                {alertLoading ? "Signing up…" : "Notify Me on New Draws"}
              </button>
            </form>
          )}
          <p className="text-xs text-gray-600 mt-3">
            No spam. Unsubscribe any time. Not affiliated with IRCC or the Government of Canada.
          </p>
        </div>
      </main>

      <footer
        className="text-center py-6 text-gray-600 text-xs"
        style={{ position: "relative", zIndex: 1 }}
      >
        🍁 ircctracker.org — Not affiliated with IRCC or the Government of Canada.
        CRS scores are estimates only; always verify with the official IRCC tool.
      </footer>
    </div>
  );
}
