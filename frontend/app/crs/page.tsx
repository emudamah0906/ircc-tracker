"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import DataFreshness from "@/components/DataFreshness";
import { CRS_FORMULA } from "@/lib/ircc-data";
import {
  AGE_SCORES_NO_SPOUSE,
  AGE_SCORES_WITH_SPOUSE,
  EDUCATION_SCORES_NO_SPOUSE,
  EDUCATION_SCORES_WITH_SPOUSE,
  FIRST_LANG_NO_SPOUSE,
  FIRST_LANG_WITH_SPOUSE,
  SECOND_LANG_SCORES,
  CANADIAN_WORK_NO_SPOUSE,
  CANADIAN_WORK_WITH_SPOUSE,
  SPOUSE_EDUCATION_SCORES,
  SPOUSE_LANG_SCORES,
  SPOUSE_CANADIAN_WORK_SCORES,
  computeSkillTransferability,
  getJobOfferPoints,
  getCanadianEducationPoints,
  getFrenchBonusPoints,
  deriveFrenchBonusTier,
  rawScoreToClb,
  TEST_LANGUAGE,
  TEST_LABEL,
  TEST_DEFAULTS,
  TEST_SCORE_OPTIONS,
  type EducationLevel,
  type CLBScores,
  type FrenchBonusTier,
  type JobOfferTier,
  type CanadianEducationTier,
  type LangTest,
  type OfficialLanguage,
  type Skill,
} from "@/lib/crs";

/**
 * One language block. Users can either enter raw test scores (we convert to
 * CLB live) or enter CLB directly if they already know it. `language` tells
 * the form whether this block represents English or French — that's what
 * lets us auto-derive the French bonus instead of asking again.
 */
type LangInputMode = "raw" | "clb";

type LangBlock = {
  language: OfficialLanguage;
  inputMode: LangInputMode;
  test: LangTest;     // ielts/celpip when language=english, tef/tcf when french
  raw: { listening: number; reading: number; writing: number; speaking: number };
  clb: CLBScores;
};

type FormState = {
  age: number;
  education: EducationLevel;
  firstLang: LangBlock;
  hasSecondLang: boolean;
  secondLang: LangBlock;
  canadianWorkExp: number; // years: 0,1,2,3,4,5
  hasSpouse: boolean;
  spouseEducation: EducationLevel;
  spouseLang: LangBlock;
  spouseCanadianWorkExp: number;
  foreignWorkExp: number; // 0, 1, 2, 3+ (stored as 0/1/2/3)
  hasTradesCertificate: boolean;
  provincialNomination: boolean;
  jobOfferType: JobOfferTier;
  canadianEducation: CanadianEducationTier;
  hasSiblingInCanada: boolean;
  /** Optional manual override; when null we auto-derive from firstLang/secondLang. */
  frenchSkillsOverride: FrenchBonusTier | null;
};

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

function makeLangBlock(language: OfficialLanguage, test: LangTest, clb = 7): LangBlock {
  const raw = { ...TEST_DEFAULTS[test] };
  return {
    language,
    inputMode: "raw",
    test,
    raw,
    clb: { listening: clb, reading: clb, writing: clb, speaking: clb },
  };
}

/** Recompute clb scores from raw test results. Returns a NEW LangBlock. */
function syncBlockClbFromRaw(block: LangBlock): LangBlock {
  return {
    ...block,
    clb: {
      listening: rawScoreToClb(block.raw.listening, block.test, "listening"),
      reading: rawScoreToClb(block.raw.reading, block.test, "reading"),
      writing: rawScoreToClb(block.raw.writing, block.test, "writing"),
      speaking: rawScoreToClb(block.raw.speaking, block.test, "speaking"),
    },
  };
}

// CRS scoring tables are imported from lib/crs.ts above. The page-level
// helpers below adapt those tables to the FormState shape used by the UI.

function getAgeKey(age: number): string {
  if (age <= 17) return "17_or_less";
  if (age >= 45) return "45_or_more";
  return String(age);
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
    getLangScoreForCLB(form.firstLang.clb.reading, langTable) +
    getLangScoreForCLB(form.firstLang.clb.writing, langTable) +
    getLangScoreForCLB(form.firstLang.clb.listening, langTable) +
    getLangScoreForCLB(form.firstLang.clb.speaking, langTable);

  let secondLangScore = 0;
  if (form.hasSecondLang) {
    secondLangScore =
      getLangScoreForCLB(form.secondLang.clb.reading, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLang.clb.writing, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLang.clb.listening, SECOND_LANG_SCORES) +
      getLangScoreForCLB(form.secondLang.clb.speaking, SECOND_LANG_SCORES);
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
      getLangScoreForCLB(form.spouseLang.clb.reading, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLang.clb.writing, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLang.clb.listening, SPOUSE_LANG_SCORES) +
      getLangScoreForCLB(form.spouseLang.clb.speaking, SPOUSE_LANG_SCORES);
    spouseWorkScore = SPOUSE_CANADIAN_WORK_SCORES[Math.min(form.spouseCanadianWorkExp, 5)] ?? 0;
  }
  const spouseFactors = spouseEducationScore + spouseLangScore + spouseWorkScore;

  // ── C. Skill Transferability (max 100 pts, with 50-pt sub-caps per group) ──
  // Skill transferability uses the CLB of the candidate's STRONGEST first
  // official language (per IRCC). That's just our firstLang block.
  const transfer = computeSkillTransferability({
    education: form.education,
    firstLangCLB: form.firstLang.clb,
    canadianWorkYears: form.canadianWorkExp,
    foreignWorkYears: form.foreignWorkExp,
    hasTradesCertificate: form.hasTradesCertificate,
  });

  // ── D. Additional Points ──
  // French bonus is auto-derived from the language inputs (which language is
  // English, which is French, what their CLBs are) unless the user has
  // explicitly overridden via the manual picker.
  const englishBlock = [form.firstLang, form.hasSecondLang ? form.secondLang : null]
    .find((b) => b?.language === "english") ?? null;
  const frenchBlock = [form.firstLang, form.hasSecondLang ? form.secondLang : null]
    .find((b) => b?.language === "french") ?? null;
  const derivedFrenchTier = deriveFrenchBonusTier(
    englishBlock ? englishBlock.clb : null,
    frenchBlock ? frenchBlock.clb : null,
  );
  const frenchTier = form.frenchSkillsOverride ?? derivedFrenchTier;

  const provincialNominationPts = form.provincialNomination ? 600 : 0;
  const jobOfferPts = getJobOfferPoints(form.jobOfferType);
  const canadianEduPts = getCanadianEducationPoints(form.canadianEducation);
  const siblingPts = form.hasSiblingInCanada ? 15 : 0;
  const frenchPts = getFrenchBonusPoints(frenchTier);

  const additionalPoints =
    provincialNominationPts + jobOfferPts + canadianEduPts + siblingPts + frenchPts;

  const total = coreHumanCapital + spouseFactors + transfer.total + additionalPoints;

  return {
    total,
    breakdown: {
      coreHumanCapital,
      spouseFactors,
      skillTransferability: transfer.total,
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
        eduPlusLang: transfer.details.eduLang,
        eduPlusWork: transfer.details.eduWork,
        foreignPlusLang: transfer.details.foreignLang,
        foreignPlusCanadian: transfer.details.foreignCanadian,
        tradesPlusLang: transfer.details.tradesLang,
        provincial: provincialNominationPts,
        jobOffer: jobOfferPts,
        canadianEdu: canadianEduPts,
        sibling: siblingPts,
        french: frenchPts,
      },
    },
  };
}

/** Picked up by the JSX — returns the auto-derived French tier so the UI can
 * show "+25 / +50 / 0" beside the (now display-only) French row. */
function deriveFrenchTierFromForm(form: FormState): FrenchBonusTier {
  const eng = [form.firstLang, form.hasSecondLang ? form.secondLang : null]
    .find((b) => b?.language === "english") ?? null;
  const fre = [form.firstLang, form.hasSecondLang ? form.secondLang : null]
    .find((b) => b?.language === "french") ?? null;
  return deriveFrenchBonusTier(eng ? eng.clb : null, fre ? fre.clb : null);
}

/**
 * Generate actionable improvement tips ordered by point delta.
 *
 * Every tip is computed by simulating a focused change to the form and
 * re-scoring — so the "+X pts" we display is exactly what the user will see
 * if they make that change. No hardcoded estimates that drift from the
 * scoring grid.
 */
type CrsTip = { id: string; text: string; gain: number };
function getCrsTips(form: FormState, currentTotal: number): CrsTip[] {
  const withChange = (patch: Partial<FormState>): number =>
    calcCRS({ ...form, ...patch }).total;

  const tips: CrsTip[] = [];
  const minFirstClb = Math.min(
    form.firstLang.clb.reading,
    form.firstLang.clb.writing,
    form.firstLang.clb.listening,
    form.firstLang.clb.speaking,
  );

  // ── Provincial Nomination — biggest single lever ──
  if (!form.provincialNomination) {
    const gain = withChange({ provincialNomination: true }) - currentTotal;
    if (gain > 0) tips.push({
      id: "pnp",
      text: "🏆 Apply to a Provincial Nominee Program (PNP) — OINP, BC PNP, AAIP, and category-based streams unlock the biggest single jump on the grid.",
      gain,
    });
  }

  // ── Push first-lang to CLB 9 in every skill (unlocks transferability + max core) ──
  if (minFirstClb < 9) {
    const boostedClb = {
      reading:   Math.max(form.firstLang.clb.reading, 9),
      writing:   Math.max(form.firstLang.clb.writing, 9),
      listening: Math.max(form.firstLang.clb.listening, 9),
      speaking:  Math.max(form.firstLang.clb.speaking, 9),
    };
    const gain = withChange({
      firstLang: { ...form.firstLang, inputMode: "clb", clb: boostedClb },
    }) - currentTotal;
    if (gain > 0) tips.push({
      id: "clb9",
      text: `🗣 Reach CLB 9 in every first-language skill (your weakest is currently CLB ${minFirstClb}). Doubles many transferability sub-scores.`,
      gain,
    });
  }

  // ── Canadian work experience tiers ──
  if (form.canadianWorkExp === 0) {
    const gain = withChange({ canadianWorkExp: 1 }) - currentTotal;
    if (gain > 0) tips.push({
      id: "canwork-1",
      text: "🇨🇦 1 year of Canadian work experience — easiest path is the post-graduation work permit (PGWP).",
      gain,
    });
  } else if (form.canadianWorkExp === 1) {
    const gain = withChange({ canadianWorkExp: 2 }) - currentTotal;
    if (gain > 0) tips.push({
      id: "canwork-2",
      text: "🇨🇦 Push Canadian work experience to 2 years to unlock the higher transferability tier.",
      gain,
    });
  }

  // ── French bilingual bonus ──
  const hasFrench = form.firstLang.language === "french"
    || (form.hasSecondLang && form.secondLang.language === "french");
  if (!hasFrench) {
    // Simulate adding a CLB 7 French second-language block.
    const frenchSecond = makeLangBlock("french", "tef", 7);
    const gain = withChange({ hasSecondLang: true, secondLang: frenchSecond }) - currentTotal;
    if (gain > 0) tips.push({
      id: "french",
      text: "🇫🇷 NCLC 7+ in French (TEF or TCF Canada) unlocks the +25 / +50 bilingual bonus — the fastest path for English-strong candidates.",
      gain,
    });
  }

  // ── Job offer ──
  if (form.jobOfferType === "none") {
    const gain = withChange({ jobOfferType: "noc_teer_0_1_2_3" }) - currentTotal;
    if (gain > 0) tips.push({
      id: "joboffer",
      text: "💼 A qualifying NOC TEER 0/1/2/3 job offer adds +50 (or +200 if it's NOC Major Group 00 senior management).",
      gain,
    });
  }

  // ── Foreign work + Canadian work transferability boost ──
  if (form.foreignWorkExp === 0) {
    const gain = withChange({ foreignWorkExp: 1 }) - currentTotal;
    if (gain > 0) tips.push({
      id: "foreignwork",
      text: "🌍 Even 1–2 years of foreign work experience pairs with your Canadian work / language to add transferability points.",
      gain,
    });
  }

  // ── Trades certificate (only meaningful if not already toggled) ──
  if (!form.hasTradesCertificate) {
    const gain = withChange({ hasTradesCertificate: true }) - currentTotal;
    if (gain > 0) tips.push({
      id: "trades",
      text: "🔧 Hold a Canadian provincial Certificate of Qualification in a skilled trade? Toggle it on — adds 25–50 transferability points.",
      gain,
    });
  }

  // ── Sibling in Canada ──
  if (!form.hasSiblingInCanada) {
    const gain = withChange({ hasSiblingInCanada: true }) - currentTotal;
    if (gain > 0) tips.push({
      id: "sibling",
      text: "👨‍👩‍👧 A sibling who is a Canadian citizen or PR adds +15 — easy to forget but worth claiming if it applies.",
      gain,
    });
  }

  tips.sort((a, b) => b.gain - a.gain);
  return tips.filter((t) => t.gain > 0).slice(0, 5);
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm: FormState = {
  age: 28,
  education: "bachelors_or_3yr",
  firstLang: makeLangBlock("english", "ielts", 7),
  hasSecondLang: false,
  secondLang: makeLangBlock("french", "tef", 4),
  canadianWorkExp: 0,
  hasSpouse: false,
  spouseEducation: "bachelors_or_3yr",
  spouseLang: makeLangBlock("english", "ielts", 4),
  spouseCanadianWorkExp: 0,
  foreignWorkExp: 0,
  hasTradesCertificate: false,
  provincialNomination: false,
  jobOfferType: "none",
  canadianEducation: "none",
  hasSiblingInCanada: false,
  frenchSkillsOverride: null,
};

// Convert any LangBlock-shaped or legacy CLB-only language data from saved
// localStorage into the new LangBlock structure.
function rehydrateLangBlock(
  saved: unknown,
  fallback: LangBlock,
): LangBlock {
  if (!saved || typeof saved !== "object") return fallback;
  const s = saved as Record<string, unknown>;
  // Already a v3 LangBlock?
  if (s.test && s.raw && s.clb && s.language) {
    return {
      language: (s.language === "french" ? "french" : "english"),
      inputMode: (s.inputMode === "clb" ? "clb" : "raw"),
      test: (["ielts", "celpip", "tef", "tcf"].includes(s.test as string)
        ? (s.test as LangTest) : fallback.test),
      raw: { ...fallback.raw, ...(s.raw as Partial<LangBlock["raw"]>) },
      clb: { ...fallback.clb, ...(s.clb as Partial<CLBScores>) },
    };
  }
  // Legacy v2: bare CLBScores object stored under firstLangCLB / secondLangCLB.
  // Keep their CLB values, default to CLB-direct mode (so we don't fabricate
  // raw scores they never entered).
  const asClb = saved as Partial<CLBScores>;
  return {
    ...fallback,
    inputMode: "clb",
    clb: {
      reading: typeof asClb.reading === "number" ? asClb.reading : fallback.clb.reading,
      writing: typeof asClb.writing === "number" ? asClb.writing : fallback.clb.writing,
      listening: typeof asClb.listening === "number" ? asClb.listening : fallback.clb.listening,
      speaking: typeof asClb.speaking === "number" ? asClb.speaking : fallback.clb.speaking,
    },
  };
}

/**
 * Migrate persisted state from any prior version of the form. Handles:
 *   v1: old French / job offer / Canadian-education enum names (pre-2026-05-09)
 *   v2: bare CLBScores stored as firstLangCLB / secondLangCLB / spouseLangCLB
 *   v3: LangBlock structure (current)
 */
function migrateForm(saved: unknown): FormState {
  const f = (saved as Record<string, unknown>) ?? {};
  const legacyFrench = f.frenchSkills as string | undefined;
  const frenchOverride: FrenchBonusTier | null =
    legacyFrench === "clb7_plus_english_clb4" ? "clb7_french_low_english" :
    legacyFrench === "clb7_plus_no_english"   ? "clb7_french_low_english" :
    (legacyFrench === "clb7_french_low_english" || legacyFrench === "clb7_french_strong_english")
      ? (legacyFrench as FrenchBonusTier) :
    (f.frenchSkillsOverride === null || f.frenchSkillsOverride === undefined)
      ? null
      : (f.frenchSkillsOverride as FrenchBonusTier);

  const legacyJob = f.jobOfferType as string | undefined;
  const jobOfferType: JobOfferTier =
    legacyJob === "noc00"     ? "noc_teer_0_major_00" :
    legacyJob === "other_noc" ? "noc_teer_0_1_2_3" :
    (["none", "noc_teer_0_major_00", "noc_teer_0_1_2_3"].includes(legacyJob ?? "")
      ? (legacyJob as JobOfferTier)
      : "none");
  const legacyEdu = f.canadianEducation as string | undefined;
  const canadianEducation: CanadianEducationTier =
    legacyEdu === "one_two_yr"     ? "one_or_two_year" :
    legacyEdu === "three_plus_yr"  ? "three_year_plus" :
    (["none", "one_or_two_year", "three_year_plus"].includes(legacyEdu ?? "")
      ? (legacyEdu as CanadianEducationTier)
      : "none");

  return {
    ...defaultForm,
    ...(f as Partial<FormState>),
    firstLang: rehydrateLangBlock(f.firstLang ?? f.firstLangCLB, defaultForm.firstLang),
    secondLang: rehydrateLangBlock(f.secondLang ?? f.secondLangCLB, defaultForm.secondLang),
    spouseLang: rehydrateLangBlock(f.spouseLang ?? f.spouseLangCLB, defaultForm.spouseLang),
    frenchSkillsOverride: frenchOverride === "none" ? null : frenchOverride,
    jobOfferType,
    canadianEducation,
    hasTradesCertificate: Boolean(f.hasTradesCertificate),
  };
}

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

/**
 * Editable language block — user picks language (English / French), the test
 * type, and per-skill scores (raw test bands OR direct CLB if they already
 * know it). The "→ CLB X" annotation under each raw input gives the user
 * confidence that the conversion is right before they trust the score.
 *
 * The lockedLanguage prop locks the English/French toggle (used when the
 * second-language block must be the OPPOSITE of the first).
 */
function LangBlockEditor({
  block,
  onChange,
  title,
  description,
  lockedLanguage,
}: {
  block: LangBlock;
  onChange: (b: LangBlock) => void;
  title: string;
  description?: string;
  lockedLanguage?: OfficialLanguage;
}) {
  const isFrench = block.language === "french";
  const englishTests: LangTest[] = ["ielts", "celpip"];
  const frenchTests: LangTest[] = ["tef", "tcf"];
  const availableTests = isFrench ? frenchTests : englishTests;

  function setLanguage(language: OfficialLanguage) {
    if (lockedLanguage && language !== lockedLanguage) return;
    // Switching language → pick the first test of that language
    const newTest: LangTest = language === "french" ? "tef" : "ielts";
    const next: LangBlock = {
      ...block,
      language,
      test: newTest,
      raw: { ...TEST_DEFAULTS[newTest] },
    };
    onChange(syncBlockClbFromRaw(next));
  }

  function setTest(test: LangTest) {
    // Switching test within same language: keep mode, reset raw to defaults
    const next: LangBlock = {
      ...block,
      test,
      raw: { ...TEST_DEFAULTS[test] },
    };
    onChange(block.inputMode === "raw" ? syncBlockClbFromRaw(next) : next);
  }

  function setMode(mode: LangInputMode) {
    if (mode === block.inputMode) return;
    const next: LangBlock = { ...block, inputMode: mode };
    onChange(mode === "raw" ? syncBlockClbFromRaw(next) : next);
  }

  function setRawSkill(skill: Skill, value: number) {
    const nextRaw = { ...block.raw, [skill]: value };
    onChange(syncBlockClbFromRaw({ ...block, raw: nextRaw }));
  }

  function setClbSkill(skill: Skill, value: number) {
    onChange({ ...block, clb: { ...block.clb, [skill]: value } });
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div>
        <p className="text-sm font-semibold text-gray-200">{title}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>

      {/* Language toggle */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Language</p>
        <div className="flex gap-2">
          {(["english", "french"] as const).map((lang) => {
            const active = block.language === lang;
            const disabled = !!lockedLanguage && lang !== lockedLanguage;
            return (
              <button
                key={lang}
                type="button"
                disabled={disabled}
                onClick={() => setLanguage(lang)}
                className={`canada-pill text-xs ${active ? "active" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {lang === "english" ? "🇬🇧 English" : "🇫🇷 French"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test type picker */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
          {isFrench ? "French test" : "English test"}
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTests.map((t) => {
            const active = block.inputMode === "raw" && block.test === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setMode("raw"); setTest(t); }}
                className={`canada-pill text-xs ${active ? "active" : ""}`}
              >
                {TEST_LABEL[t]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMode("clb")}
            className={`canada-pill text-xs ${block.inputMode === "clb" ? "active" : ""}`}
          >
            I know my CLB
          </button>
        </div>
      </div>

      {/* Per-skill score inputs */}
      {block.inputMode === "raw" ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
            Your {TEST_LABEL[block.test]} bands
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SKILLS.map((skill) => {
              const options = TEST_SCORE_OPTIONS[block.test][skill];
              const clb = block.clb[skill];
              return (
                <div key={skill}>
                  <p className="text-xs text-gray-500 capitalize mb-1">{skill}</p>
                  <select
                    value={block.raw[skill]}
                    onChange={(e) => setRawSkill(skill, Number(e.target.value))}
                    className="canada-input text-sm py-1.5 w-full"
                  >
                    {options.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-0.5">→ {clbLabel(clb)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
            Your CLB scores
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SKILLS.map((skill) => (
              <div key={skill}>
                <p className="text-xs text-gray-500 capitalize mb-1">{skill}</p>
                <select
                  value={block.clb[skill]}
                  onChange={(e) => setClbSkill(skill, Number(e.target.value))}
                  className="canada-input text-sm py-1.5 w-full"
                >
                  {[4, 5, 6, 7, 8, 9, 10].map((clb) => (
                    <option key={clb} value={clb}>{clbLabel(clb)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-600 pt-1">
        These scores belong to your <strong>{TEST_LANGUAGE[block.test]}</strong>{" "}
        skills — French scores go in a separate block so the calculator can
        award the right bonus.
      </p>
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
  const [recentDraws, setRecentDraws] = useState<{ score: number; date: string; program: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crs_form_v2");
      if (saved) setForm(migrateForm(JSON.parse(saved)));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("crs_form_v2", JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    supabase
      .from("pr_draws")
      .select("crs_score, draw_date, program")
      .is("province", null)
      .not("crs_score", "is", null)
      .order("draw_date", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setRecentDraws(
            data.map((d) => ({
              score: d.crs_score as number,
              date: d.draw_date as string,
              program: d.program as string,
            }))
          );
        }
      });
  }, []);

  const result = useMemo(() => calcCRS(form), [form]);
  const { total, breakdown } = result;
  const tips = useMemo(() => getCrsTips(form, total), [form, total]);

  const latestCutoff = recentDraws[0]?.score ?? 477;
  const pointsNeeded = Math.max(0, latestCutoff - total);
  const scoreColor =
    total >= 470
      ? { ring: "ring-green-500", text: "text-green-400", badge: "bg-green-900/40 text-green-300 border-green-700", fab: "bg-green-600 hover:bg-green-500" }
      : total >= 400
      ? { ring: "ring-yellow-500", text: "text-yellow-400", badge: "bg-yellow-900/40 text-yellow-300 border-yellow-700", fab: "bg-yellow-600 hover:bg-yellow-500" }
      : { ring: "ring-red-500", text: "text-red-400", badge: "bg-red-900/40 text-red-300 border-red-700", fab: "bg-red-600 hover:bg-red-500" };

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
    <PageLayout subtitle="CRS Score Calculator" activeNav="crs">
      <div className="space-y-6" style={{ position: "relative", zIndex: 1 }}>
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

              {/* First language — pick which language, which test, then enter raw scores or CLB */}
              <LangBlockEditor
                title="First Official Language"
                description="Your strongest official language (English or French). Pick the one with your highest scores."
                block={form.firstLang}
                onChange={(b) => {
                  // If the user flips first-lang to French and second-lang
                  // is also currently French, flip second-lang to English
                  // automatically so the two stay opposite. (And vice versa.)
                  setForm((f) => {
                    const next: FormState = { ...f, firstLang: b };
                    if (f.hasSecondLang && f.secondLang.language === b.language) {
                      const otherLang: OfficialLanguage = b.language === "english" ? "french" : "english";
                      const otherTest: LangTest = otherLang === "french" ? "tef" : "ielts";
                      next.secondLang = makeLangBlock(otherLang, otherTest, 4);
                    }
                    return next;
                  });
                }}
              />
              <p className="text-xs text-gray-500">
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
                  <LangBlockEditor
                    title="Second Official Language"
                    description={
                      form.firstLang.language === "english"
                        ? "Your French scores. (Locked — your first language is English.)"
                        : "Your English scores. (Locked — your first language is French.)"
                    }
                    block={form.secondLang}
                    onChange={(b) => set("secondLang", b)}
                    lockedLanguage={form.firstLang.language === "english" ? "french" : "english"}
                  />
                  <p className="text-xs text-gray-500">
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

                  <LangBlockEditor
                    title="Spouse's First Official Language"
                    description="Your spouse's strongest official language. Each test has its own scoring scale, so we convert for you."
                    block={form.spouseLang}
                    onChange={(b) => set("spouseLang", b)}
                  />
                  <p className="text-xs text-gray-500">
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

              <div className="pt-2">
                <Toggle
                  checked={form.hasTradesCertificate}
                  onChange={(v) => set("hasTradesCertificate", v)}
                  label="I hold a Canadian provincial Certificate of Qualification in a skilled trade"
                />
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
                {form.hasTradesCertificate && (
                  <div className="canada-card p-3 space-y-1 sm:col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Trades Certificate + Language</p>
                    <p className="text-2xl font-bold text-white">{breakdown.details.tradesPlusLang}</p>
                    <p className="text-xs text-gray-500">CLB 5+ → 25 pts, CLB 7+ → 50 pts</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 pt-2">
                Each group (education, foreign work, trades) caps at 50 pts. Overall total caps at 100 pts.
              </p>
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
                <Label>Valid Job Offer (must be supported by an LMIA, where required)</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { val: "none", label: "No job offer", pts: "0 pts" },
                    { val: "noc_teer_0_major_00", label: "NOC TEER 0 — Major Group 00 (senior mgmt: CEO, CFO, GM)", pts: "+200 pts" },
                    { val: "noc_teer_0_1_2_3", label: "Other valid NOC TEER 0, 1, 2, or 3", pts: "+50 pts" },
                  ] as const).map(({ val, label, pts }) => (
                    <button
                      key={val}
                      onClick={() => set("jobOfferType", val)}
                      className={`canada-pill ${form.jobOfferType === val ? "active" : ""} text-xs`}
                    >
                      {label}
                      <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  The 200-pt bonus only applies to NOC Major Group 00 (senior management roles).
                  Most TEER 0 positions (other managers) qualify for the 50-pt bonus.
                </p>
              </div>

              {/* Canadian Education */}
              <div>
                <Label>Canadian Education (studied in Canada)</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { val: "none", label: "None", pts: "0 pts" },
                    { val: "one_or_two_year", label: "1–2 year program", pts: "+15 pts" },
                    { val: "three_year_plus", label: "3+ year program", pts: "+30 pts" },
                  ] as const).map(({ val, label, pts }) => (
                    <button
                      key={val}
                      onClick={() => set("canadianEducation", val)}
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

              {/* French — auto-derived from the language sections above */}
              <div>
                <Label>French Language Bonus (auto-detected)</Label>
                {(() => {
                  const derived = deriveFrenchTierFromForm(form);
                  const overridden = form.frenchSkillsOverride !== null;
                  const effective = form.frenchSkillsOverride ?? derived;
                  const tierCopy: Record<FrenchBonusTier, { label: string; pts: string; tone: string }> = {
                    none:                          { label: "Not eligible — need NCLC 7+ in all four French skills",           pts: "+0 pts",  tone: "text-gray-400" },
                    clb7_french_low_english:       { label: "NCLC 7+ French + low/no English",                                  pts: "+25 pts", tone: "text-green-300" },
                    clb7_french_strong_english:    { label: "NCLC 7+ French + English CLB 5+ in all 4 — strong bilingual",     pts: "+50 pts", tone: "text-green-300" },
                  };
                  const c = tierCopy[effective];
                  return (
                    <div className={`canada-card p-3 ${overridden ? "border-yellow-500/30" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-medium ${c.tone}`}>{c.label}</p>
                        <span className={`text-base font-bold ${c.tone}`}>{c.pts}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {overridden ? (
                          <>You&apos;ve overridden the auto-detected tier. </>
                        ) : (
                          <>Computed from your English + French language scores above. </>
                        )}
                        Per IRCC&apos;s Oct 2022 update — strong bilingual candidates get the full 50-pt bonus.
                      </p>
                      {overridden && (
                        <button
                          type="button"
                          onClick={() => set("frenchSkillsOverride", null)}
                          className="text-xs text-yellow-400 hover:underline mt-2"
                        >
                          Reset to auto-detect ({tierCopy[derived].label.split("—")[0].trim()})
                        </button>
                      )}
                    </div>
                  );
                })()}
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                    Override manually (only if you need to)
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {([
                      { val: "none", label: "Force: no French bonus", pts: "0 pts" },
                      { val: "clb7_french_low_english", label: "Force: +25 pts", pts: "+25 pts" },
                      { val: "clb7_french_strong_english", label: "Force: +50 pts", pts: "+50 pts" },
                    ] as const).map(({ val, label, pts }) => (
                      <button
                        key={val}
                        onClick={() => set("frenchSkillsOverride", val)}
                        className={`canada-pill text-xs ${form.frenchSkillsOverride === val ? "active" : ""}`}
                      >
                        {label}
                        <span className="ml-1 opacity-70">{pts}</span>
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </SectionCard>
          </div>

          {/* ── Right: Score Panel ── */}
          <div id="crs-score-panel" className="space-y-4 scroll-mt-24">
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
                  <span className="font-bold text-white">
                    {recentDraws.length > 0 ? latestCutoff : "Loading…"}
                  </span>
                </p>
                {recentDraws.length > 0 && (
                  <>
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
                          total >= latestCutoff ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${Math.min((total / latestCutoff) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round((total / latestCutoff) * 100)}% of cutoff score
                    </p>
                  </>
                )}
              </div>

              {/* Score vs Recent Draws history */}
              {recentDraws.length > 0 && (
                <div className="canada-card p-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                    Your Score vs Last {Math.min(recentDraws.length, 5)} Draws
                  </p>
                  <div className="space-y-2">
                    {recentDraws.slice(0, 5).map((draw, i) => {
                      const meetsIt = total >= draw.score;
                      const diff = total - draw.score;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              meetsIt ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-gray-500 w-20 flex-shrink-0">
                            {new Date(draw.date).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-white font-mono font-bold w-8 flex-shrink-0">
                            {draw.score}
                          </span>
                          <span
                            className={`ml-auto font-semibold ${
                              meetsIt ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Green = your score qualifies · Red = below cutoff
                  </p>
                </div>
              )}

              {/* What to fix next — actionable tips ordered by point delta */}
              {tips.length > 0 && (
                <div className="canada-card p-4 space-y-2 ring-1 ring-yellow-700/30">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-yellow-400">
                      What would boost your score
                    </p>
                    <span className="text-[10px] text-gray-600">live what-if</span>
                  </div>
                  <ul className="space-y-2">
                    {tips.map((t) => (
                      <li key={t.id} className="flex items-start gap-3 text-xs text-gray-300">
                        <span className="text-green-400 font-bold whitespace-nowrap font-mono shrink-0 pt-0.5">
                          +{t.gain}
                        </span>
                        <span className="leading-snug">{t.text}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-600 pt-1 border-t border-white/5">
                    Each &quot;+X&quot; is the actual jump you&apos;d see if you made that change today —
                    re-computed live from the IRCC grid, not a hardcoded estimate.
                  </p>
                </div>
              )}

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

        <DataFreshness
          lastVerified={CRS_FORMULA.lastVerified}
          source={CRS_FORMULA.source}
          sourceLabel={CRS_FORMULA.sourceLabel}
          cadence={CRS_FORMULA.cadence}
          note={CRS_FORMULA.note}
        />

        {/* Cross-tool suggestions */}
        <a href="/draws" className="canada-next-step" style={{ textDecoration: "none" }}>
          <span className="text-2xl">🗳</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Check latest Express Entry draws</p>
            <p className="text-xs text-gray-400">See if your CRS score meets the latest cut-off</p>
          </div>
          <span className="text-gray-400 text-sm whitespace-nowrap">View Draws →</span>
        </a>
        <a href="/pathway" className="canada-next-step" style={{ textDecoration: "none" }}>
          <span className="text-2xl">🗺️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Explore other pathways</p>
            <p className="text-xs text-gray-400">Express Entry isn't the only way — find all your options</p>
          </div>
          <span className="text-gray-400 text-sm whitespace-nowrap">Find Pathways →</span>
        </a>
      </div>

      {/* Floating mobile-only score pill — gives instant feedback while filling the form */}
      <button
        onClick={() => {
          document.getElementById("crs-score-panel")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
        aria-label={`Your CRS score is ${total}. Tap for full breakdown.`}
        className={`lg:hidden fixed bottom-5 right-5 z-50 flex items-center gap-3 pl-5 pr-4 py-3 rounded-full text-white shadow-2xl transition-colors ${scoreColor.fab}`}
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
      >
        <span className="text-[10px] uppercase tracking-widest opacity-85 leading-none">
          Your CRS
        </span>
        <span className="text-2xl font-black tabular-nums leading-none">{total}</span>
        <span className="text-base leading-none">↑</span>
      </button>
    </PageLayout>
  );
}
