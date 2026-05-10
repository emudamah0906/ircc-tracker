"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageLayout from "@/components/PageLayout";
import { LoadingState, ErrorState } from "@/components/QueryStates";
import type { User } from "@supabase/supabase-js";
import {
  getAgePoints,
  getEducationPoints,
  getFirstLangPoints,
  getCanadianWorkPoints,
  getSpouseEducationPoints,
  getSpouseLangPoints,
  getSpouseCanadianWorkPoints,
  computeSkillTransferability,
  getJobOfferPoints,
  getCanadianEducationPoints,
  getFrenchBonusPoints,
  deriveFrenchBonusTier,
  rawScoreToClb,
  TEST_DEFAULTS,
  TEST_LABEL,
  TEST_LANGUAGE,
  TEST_SCORE_OPTIONS,
  type CLBScores,
  type EducationLevel,
  type LangTest,
  type OfficialLanguage,
  type Skill,
  type JobOfferTier,
  type CanadianEducationTier,
} from "@/lib/crs";

type Profile = {
  age: number;
  marital_status: "single" | "married";
  education: EducationLevel;

  // ── Applicant first official language ──
  first_lang_test: LangTest;            // ielts/celpip/tef/tcf
  first_lang_choice: OfficialLanguage;  // english/french
  first_lang_reading: number;
  first_lang_writing: number;
  first_lang_listening: number;
  first_lang_speaking: number;

  // ── Optional French block (only if candidate has French alongside English) ──
  has_french_lang: boolean;
  french_lang_test: LangTest;           // typically tef or tcf
  french_lang_reading: number;
  french_lang_writing: number;
  french_lang_listening: number;
  french_lang_speaking: number;

  canada_work_years: number;
  foreign_work_years: number;

  // ── Tiered additional-points (replaces boolean has_job_offer/has_canadian_education) ──
  job_offer_tier: JobOfferTier;
  canadian_education_tier: CanadianEducationTier;
  has_provincial_nomination: boolean;
  has_canadian_sibling: boolean;

  // ── Spouse ──
  spouse_education: EducationLevel;
  spouse_lang_test: LangTest;
  spouse_lang_choice: OfficialLanguage;
  spouse_lang_reading: number;
  spouse_lang_writing: number;
  spouse_lang_listening: number;
  spouse_lang_speaking: number;
  spouse_canada_work_years: number;

  // ── Legacy fields kept ONLY for backwards-compat read from old saved rows ──
  /** @deprecated use first_lang_test */ lang_test?: LangTest;
  /** @deprecated use job_offer_tier */ has_job_offer?: boolean;
  /** @deprecated use canadian_education_tier */ has_canadian_education?: boolean;
};

const DEFAULT_PROFILE: Profile = {
  age: 28,
  marital_status: "single",
  education: "bachelors_or_3yr",

  first_lang_test: "ielts",
  first_lang_choice: "english",
  first_lang_reading: 7,
  first_lang_writing: 7,
  first_lang_listening: 7,
  first_lang_speaking: 7,

  has_french_lang: false,
  french_lang_test: "tef",
  french_lang_reading: TEST_DEFAULTS.tef.reading,
  french_lang_writing: TEST_DEFAULTS.tef.writing,
  french_lang_listening: TEST_DEFAULTS.tef.listening,
  french_lang_speaking: TEST_DEFAULTS.tef.speaking,

  canada_work_years: 0,
  foreign_work_years: 1,

  job_offer_tier: "none",
  canadian_education_tier: "none",
  has_provincial_nomination: false,
  has_canadian_sibling: false,

  spouse_education: "bachelors_or_3yr",
  spouse_lang_test: "ielts",
  spouse_lang_choice: "english",
  spouse_lang_reading: 5,
  spouse_lang_writing: 5,
  spouse_lang_listening: 5,
  spouse_lang_speaking: 5,
  spouse_canada_work_years: 0,
};

/** Normalize legacy education values stored in older saved profiles. */
function normalizeEducation(value: string | undefined | null): EducationLevel {
  if (value === "bachelors") return "bachelors_or_3yr";
  const valid: EducationLevel[] = [
    "less_than_secondary", "secondary", "one_year_diploma", "two_year_diploma",
    "bachelors_or_3yr", "two_or_more_certs", "masters", "doctoral",
  ];
  return (valid.includes(value as EducationLevel) ? value : "bachelors_or_3yr") as EducationLevel;
}

/**
 * Backfill the new schema fields from old saved rows on read. Without this,
 * pre-2026-05-09 profiles would lose their job-offer / Canadian-education
 * indicators after the schema upgrade.
 */
function normalizeProfile(raw: Partial<Profile>): Profile {
  const out: Profile = { ...DEFAULT_PROFILE, ...(raw as Profile) };
  out.education = normalizeEducation(out.education);
  out.spouse_education = normalizeEducation(out.spouse_education);

  // Legacy lang_test → first_lang_test + spouse_lang_test
  if (raw.lang_test && !raw.first_lang_test) out.first_lang_test = raw.lang_test;
  if (raw.lang_test && !raw.spouse_lang_test) out.spouse_lang_test = raw.lang_test;

  // Legacy has_job_offer → job_offer_tier (we can't infer the major-00 tier
  // from a boolean, so default to the +50 "other valid NOC" tier)
  if (raw.has_job_offer && !raw.job_offer_tier) out.job_offer_tier = "noc_teer_0_1_2_3";
  if (!out.job_offer_tier) out.job_offer_tier = "none";

  // Legacy has_canadian_education → canadian_education_tier (default to +15)
  if (raw.has_canadian_education && !raw.canadian_education_tier) {
    out.canadian_education_tier = "one_or_two_year";
  }
  if (!out.canadian_education_tier) out.canadian_education_tier = "none";

  // Validate language enums
  const validTests: LangTest[] = ["ielts", "celpip", "tef", "tcf"];
  if (!validTests.includes(out.first_lang_test)) out.first_lang_test = "ielts";
  if (!validTests.includes(out.spouse_lang_test)) out.spouse_lang_test = "ielts";
  if (!validTests.includes(out.french_lang_test)) out.french_lang_test = "tef";

  if (out.first_lang_choice !== "french") out.first_lang_choice = "english";
  if (out.spouse_lang_choice !== "french") out.spouse_lang_choice = "english";

  return out;
}

// ── CRS Calculation — shape adapter that wraps lib/crs helpers ────────────────
/**
 * Wraps the saved Profile shape and calls the canonical helpers in lib/crs.ts.
 * /crs and /dashboard now share identical scoring logic — the only difference
 * is that the saved profile model uses booleans for job offer / Canadian
 * education / French (no granular tier), so the dashboard awards the lower
 * tier in those cases. The /crs page captures full granularity.
 */
/** Build CLBScores for one block by converting raw test scores via the centralized table. */
function blockToClb(
  test: LangTest,
  reading: number, writing: number, listening: number, speaking: number,
): CLBScores {
  return {
    reading:   rawScoreToClb(reading,   test, "reading"),
    writing:   rawScoreToClb(writing,   test, "writing"),
    listening: rawScoreToClb(listening, test, "listening"),
    speaking:  rawScoreToClb(speaking,  test, "speaking"),
  };
}

function calcCRS(p: Profile): { total: number; breakdown: Record<string, number> } {
  const hasSpouse = p.marital_status === "married";
  const breakdown: Record<string, number> = {};

  // ── First-language CLB ──
  const firstLangCLB: CLBScores = blockToClb(
    p.first_lang_test,
    p.first_lang_reading, p.first_lang_writing,
    p.first_lang_listening, p.first_lang_speaking,
  );

  // ── Optional French block CLB ──
  const frenchCLB: CLBScores | null = p.has_french_lang ? blockToClb(
    p.french_lang_test,
    p.french_lang_reading, p.french_lang_writing,
    p.french_lang_listening, p.french_lang_speaking,
  ) : null;

  // ── A: Core human capital ──
  breakdown.age = getAgePoints(p.age, hasSpouse);
  breakdown.education = getEducationPoints(p.education, hasSpouse);
  breakdown.language =
    getFirstLangPoints(firstLangCLB.reading, hasSpouse) +
    getFirstLangPoints(firstLangCLB.writing, hasSpouse) +
    getFirstLangPoints(firstLangCLB.listening, hasSpouse) +
    getFirstLangPoints(firstLangCLB.speaking, hasSpouse);

  // Second-language points (capped at 24) — applies when the candidate has
  // a French block. The "second" language is whichever of the two isn't
  // their first.
  let secondLangScore = 0;
  if (frenchCLB) {
    if (p.first_lang_choice === "english") {
      // English is first, French is second
      secondLangScore = Math.min(24,
        getSpouseLangPoints(frenchCLB.reading) + // SECOND_LANG = SPOUSE_LANG table (same per-skill values)
        getSpouseLangPoints(frenchCLB.writing) +
        getSpouseLangPoints(frenchCLB.listening) +
        getSpouseLangPoints(frenchCLB.speaking),
      );
    } else {
      // French is first, English would be second — but we don't have a
      // separate English block in this case (English IS the first), so 0.
      // (When the applicant's primary test is French, they should put the
      // English block as the "first" to get richer scoring — explained in UI.)
      secondLangScore = 0;
    }
  }
  breakdown.secondLanguage = secondLangScore;
  breakdown.language += secondLangScore;

  breakdown.canadaWork = getCanadianWorkPoints(p.canada_work_years, hasSpouse);

  // ── B: Spouse factors ──
  breakdown.spouse = 0;
  if (hasSpouse) {
    const spouseCLB = blockToClb(
      p.spouse_lang_test,
      p.spouse_lang_reading, p.spouse_lang_writing,
      p.spouse_lang_listening, p.spouse_lang_speaking,
    );
    breakdown.spouse += getSpouseEducationPoints(p.spouse_education);
    breakdown.spouse +=
      getSpouseLangPoints(spouseCLB.reading) +
      getSpouseLangPoints(spouseCLB.writing) +
      getSpouseLangPoints(spouseCLB.listening) +
      getSpouseLangPoints(spouseCLB.speaking);
    breakdown.spouse += getSpouseCanadianWorkPoints(p.spouse_canada_work_years);
  }

  // ── C: Skill transferability (with proper 50-pt sub-caps + 100-pt overall cap) ──
  // Skill transferability uses the candidate's STRONGEST first official
  // language (per IRCC) — that's the firstLang block.
  const transfer = computeSkillTransferability({
    education: p.education,
    firstLangCLB,
    canadianWorkYears: p.canada_work_years,
    foreignWorkYears: p.foreign_work_years,
  });
  breakdown.transferability = transfer.total;

  // ── D: Additional points ──
  // French bonus: derived from English + French CLB.
  // - If first lang is English, English block IS the English data.
  // - If first lang is French, French block goes to the optional-French slot
  //   and there's no English data (returns "none" for bonus).
  const englishClbForBonus =
    p.first_lang_choice === "english" ? firstLangCLB :
    null;
  const frenchClbForBonus =
    p.first_lang_choice === "french" ? firstLangCLB :
    frenchCLB;
  const frenchTier = deriveFrenchBonusTier(englishClbForBonus, frenchClbForBonus);

  breakdown.frenchBonus = getFrenchBonusPoints(frenchTier);
  breakdown.jobOffer = getJobOfferPoints(p.job_offer_tier);
  breakdown.canadianEducation = getCanadianEducationPoints(p.canadian_education_tier);
  breakdown.additional =
    (p.has_provincial_nomination ? 600 : 0) +
    breakdown.jobOffer +
    breakdown.canadianEducation +
    breakdown.frenchBonus +
    (p.has_canadian_sibling ? 15 : 0);

  const total = Math.min(1200,
    breakdown.age + breakdown.education + breakdown.language +
    breakdown.canadaWork + breakdown.spouse + breakdown.transferability + breakdown.additional
  );
  return { total, breakdown };
}

function getTips(p: Profile, score: number, cutoff: number): string[] {
  const tips: string[] = [];
  const gap = cutoff - score;
  const minCLB = Math.min(
    rawScoreToClb(p.first_lang_reading, p.first_lang_test, "reading"),
    rawScoreToClb(p.first_lang_writing, p.first_lang_test, "writing"),
    rawScoreToClb(p.first_lang_listening, p.first_lang_test, "listening"),
    rawScoreToClb(p.first_lang_speaking, p.first_lang_test, "speaking"),
  );

  if (!p.has_provincial_nomination)
    tips.push("🏆 Provincial Nomination (PNP) adds 600 pts instantly — explore OINP, BC PNP, AINP");
  if (p.job_offer_tier === "none")
    tips.push("💼 A qualifying job offer (NOC TEER 0/1/2/3) adds 50–200 points");
  if (p.canada_work_years < 1)
    tips.push("🇨🇦 At least 1 year of Canadian work experience adds 40 points");
  if (p.canada_work_years >= 1 && p.canada_work_years < 3)
    tips.push("🇨🇦 Increasing Canadian work experience to 3+ years adds up to 80 points");
  if (minCLB < 9)
    tips.push("🗣 Reaching CLB 9 in your weakest language skill unlocks both core and skill-transferability bonuses");
  if (!p.has_french_lang)
    tips.push("🇫🇷 Adding NCLC 7+ French unlocks a +25 or +50 bilingual bonus");
  if (gap > 0 && gap <= 50)
    tips.push(`📈 Only ${gap} pts below cut-off — a small improvement could get you an ITA!`);
  if (!p.has_canadian_sibling)
    tips.push("👨‍👩‍👧 A sibling who is a Canadian citizen or PR adds 15 points");

  return tips.slice(0, 4);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const IELTS_OPTIONS = [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4];
const CELPIP_OPTIONS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3];
const EDU_OPTIONS = [
  { value: "less_than_secondary", label: "Less than Secondary" },
  { value: "secondary", label: "Secondary (High School)" },
  { value: "one_year_diploma", label: "1-Year Diploma / Certificate" },
  { value: "two_year_diploma", label: "2-Year Diploma / Certificate" },
  { value: "bachelors_or_3yr", label: "Bachelor's Degree (3–4 years)" },
  { value: "two_or_more_certs", label: "Two or More Certificates" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctoral", label: "PhD / Doctoral" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [latestCutoff, setLatestCutoff] = useState(477);
  const [latestDrawDate, setLatestDrawDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      try {
        const { data: existing, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", u.id)
          .single();
        // PGRST116 = "no rows returned" — that's normal for a brand new user.
        if (error && error.code !== "PGRST116") {
          throw new Error(error.message);
        }
        if (existing) {
          setProfile(normalizeProfile(existing as Partial<Profile>));
        }
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Couldn't load your saved profile.");
      } finally {
        setLoadingProfile(false);
      }
    });
    // Latest cutoff is a soft requirement — failures degrade gracefully to
    // the 477 default. Logged silently.
    supabase.from("pr_draws").select("crs_score, draw_date").is("province", null)
      .order("draw_date", { ascending: false }).limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.warn("[dashboard] latest-cutoff fetch failed:", error.message);
          return;
        }
        if (data?.[0]?.crs_score) setLatestCutoff(data[0].crs_score);
        if (data?.[0]?.draw_date) setLatestDrawDate(data[0].draw_date);
      });
  }, [router]);

  const { total: crsScore, breakdown } = useMemo(() => calcCRS(profile), [profile]);
  const gap = latestCutoff - crsScore;
  const isEligible = crsScore >= latestCutoff;
  const tips = useMemo(() => getTips(profile, crsScore, latestCutoff), [profile, crsScore, latestCutoff]);
  const hasSpouse = profile.marital_status === "married";
  // Per-test, per-skill score options (centralized in lib/crs).
  function optionsFor(test: LangTest, skill: Skill): number[] {
    return TEST_SCORE_OPTIONS[test][skill];
  }
  // When the user switches a block's test type, reset its raw scores to the
  // sensible per-skill defaults for the new test (e.g. CELPIP 7 vs TEF 249).
  function setBlockTest(
    block: "first" | "spouse" | "french",
    newTest: LangTest,
  ) {
    const defaults = TEST_DEFAULTS[newTest];
    setProfile((prev) => {
      if (block === "first") return {
        ...prev,
        first_lang_test: newTest,
        first_lang_listening: defaults.listening,
        first_lang_reading:   defaults.reading,
        first_lang_writing:   defaults.writing,
        first_lang_speaking:  defaults.speaking,
      };
      if (block === "spouse") return {
        ...prev,
        spouse_lang_test: newTest,
        spouse_lang_listening: defaults.listening,
        spouse_lang_reading:   defaults.reading,
        spouse_lang_writing:   defaults.writing,
        spouse_lang_speaking:  defaults.speaking,
      };
      return {
        ...prev,
        french_lang_test: newTest,
        french_lang_listening: defaults.listening,
        french_lang_reading:   defaults.reading,
        french_lang_writing:   defaults.writing,
        french_lang_speaking:  defaults.speaking,
      };
    });
    setSaved(false);
  }

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    await supabase.from("user_profiles").upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaved(true);
  }

  if (loadingProfile) {
    return (
      <PageLayout activeNav="dashboard">
        <LoadingState label="Loading your profile…" />
      </PageLayout>
    );
  }
  if (profileError) {
    return (
      <PageLayout activeNav="dashboard">
        <ErrorState
          message={profileError}
          onRetry={() => window.location.reload()}
          hint="Your saved profile couldn't be loaded — usually a brief Supabase blip. A reload almost always fixes it."
        />
      </PageLayout>
    );
  }

  const scoreColor = isEligible ? "#22c55e" : gap <= 50 ? "#eab308" : "#d52b1e";

  return (
    <PageLayout activeNav="dashboard">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My PR Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in your details — we calculate your CRS score and PR eligibility live.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-base">👤 Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Age</label>
                  <input type="number" min={18} max={60} value={profile.age}
                    onChange={e => update("age", Number(e.target.value))}
                    className="canada-input py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Marital Status</label>
                  <select value={profile.marital_status}
                    onChange={e => update("marital_status", e.target.value as "single" | "married")}
                    className="canada-input py-2 text-sm">
                    <option value="single">Single / No Spouse</option>
                    <option value="married">Married / Common-Law</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Highest Education Level</label>
                <select value={profile.education} onChange={e => update("education", e.target.value as EducationLevel)} className="canada-input py-2 text-sm">
                  {EDU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* First Official Language */}
            <div className="canada-card p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-base">🗣 First Official Language</h2>
                {/* English/French choice */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                  {(["english", "french"] as const).map(lang => (
                    <button key={lang} onClick={() => update("first_lang_choice", lang)}
                      style={{
                        padding: "5px 12px", fontWeight: 600, border: "none", cursor: "pointer",
                        background: profile.first_lang_choice === lang ? "linear-gradient(135deg,#d52b1e,#a01208)" : "transparent",
                        color: profile.first_lang_choice === lang ? "white" : "#9ca3af",
                      }}>
                      {lang === "english" ? "🇬🇧 English" : "🇫🇷 French"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test type picker — only tests valid for the chosen language */}
              <div className="flex flex-wrap gap-2">
                {(profile.first_lang_choice === "english"
                  ? (["ielts", "celpip"] as LangTest[])
                  : (["tef", "tcf"] as LangTest[])
                ).map(t => (
                  <button key={t} onClick={() => setBlockTest("first", t)}
                    className={`canada-pill text-xs ${profile.first_lang_test === t ? "active" : ""}`}>
                    {TEST_LABEL[t]}
                  </button>
                ))}
              </div>

              {/* If the language flipped but the saved test doesn't match the new
                  language, force-switch the test before rendering inputs. */}
              {(() => {
                const expectedLang = TEST_LANGUAGE[profile.first_lang_test];
                if (expectedLang !== profile.first_lang_choice) {
                  // Use setTimeout to defer until after render — calling setProfile during render is illegal
                  setTimeout(() => setBlockTest("first", profile.first_lang_choice === "english" ? "ielts" : "tef"), 0);
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                {(["first_lang_listening","first_lang_reading","first_lang_writing","first_lang_speaking"] as const).map(key => {
                  const skill = key.replace("first_lang_","") as Skill;
                  const clb = rawScoreToClb(profile[key], profile.first_lang_test, skill);
                  return (
                    <div key={key}>
                      <label className="text-xs text-gray-400 mb-1 block capitalize">
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        <span className="text-gray-600 ml-2">→ CLB {clb}</span>
                      </label>
                      <select value={profile[key]} onChange={e => update(key, Number(e.target.value))}
                        className="canada-input py-2 text-sm">
                        {optionsFor(profile.first_lang_test, skill).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional French Language Block — for English-first applicants who also have French */}
            {profile.first_lang_choice === "english" && (
              <div className="canada-card p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-semibold text-base">🇫🇷 French Language (optional)</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      NCLC 7+ in all 4 French skills earns +25 (or +50 with strong English).
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={profile.has_french_lang}
                      onChange={e => update("has_french_lang", e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer" />
                    <span className="text-sm text-gray-300">I have French scores</span>
                  </label>
                </div>

                {profile.has_french_lang && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {(["tef", "tcf"] as LangTest[]).map(t => (
                        <button key={t} onClick={() => setBlockTest("french", t)}
                          className={`canada-pill text-xs ${profile.french_lang_test === t ? "active" : ""}`}>
                          {TEST_LABEL[t]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {(["french_lang_listening","french_lang_reading","french_lang_writing","french_lang_speaking"] as const).map(key => {
                        const skill = key.replace("french_lang_","") as Skill;
                        const clb = rawScoreToClb(profile[key], profile.french_lang_test, skill);
                        return (
                          <div key={key}>
                            <label className="text-xs text-gray-400 mb-1 block capitalize">
                              {skill.charAt(0).toUpperCase() + skill.slice(1)}
                              <span className="text-gray-600 ml-2">→ CLB {clb}</span>
                            </label>
                            <select value={profile[key]} onChange={e => update(key, Number(e.target.value))}
                              className="canada-input py-2 text-sm">
                              {optionsFor(profile.french_lang_test, skill).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2 text-xs text-blue-300">
                      French bonus: <strong>+{breakdown.frenchBonus} pts</strong> (auto-detected from your scores)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Spouse Section — only if married */}
            {hasSpouse && (
              <div className="canada-card p-6 space-y-4" style={{ borderColor: "rgba(59,130,246,0.25)" }}>
                <div>
                  <h2 className="font-semibold text-base">💑 Spouse / Partner Details</h2>
                  <p className="text-xs text-gray-500 mt-1">Spouse factors add up to 40 points to your CRS score</p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Spouse Education</label>
                  <select value={profile.spouse_education} onChange={e => update("spouse_education", e.target.value as EducationLevel)} className="canada-input py-2 text-sm">
                    {EDU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <label className="text-xs text-gray-400 block">Spouse Language Test</label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                      {(["english", "french"] as const).map(lang => (
                        <button key={lang} onClick={() => update("spouse_lang_choice", lang)}
                          style={{
                            padding: "4px 10px", fontWeight: 600, border: "none", cursor: "pointer",
                            background: profile.spouse_lang_choice === lang ? "linear-gradient(135deg,#d52b1e,#a01208)" : "transparent",
                            color: profile.spouse_lang_choice === lang ? "white" : "#9ca3af",
                          }}>
                          {lang === "english" ? "🇬🇧" : "🇫🇷"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(profile.spouse_lang_choice === "english"
                      ? (["ielts", "celpip"] as LangTest[])
                      : (["tef", "tcf"] as LangTest[])
                    ).map(t => (
                      <button key={t} onClick={() => setBlockTest("spouse", t)}
                        className={`canada-pill text-xs ${profile.spouse_lang_test === t ? "active" : ""}`}>
                        {TEST_LABEL[t]}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const expectedLang = TEST_LANGUAGE[profile.spouse_lang_test];
                    if (expectedLang !== profile.spouse_lang_choice) {
                      setTimeout(() => setBlockTest("spouse", profile.spouse_lang_choice === "english" ? "ielts" : "tef"), 0);
                    }
                    return null;
                  })()}
                  <div className="grid grid-cols-2 gap-3">
                    {(["spouse_lang_listening","spouse_lang_reading","spouse_lang_writing","spouse_lang_speaking"] as const).map(key => {
                      const skill = key.replace("spouse_lang_","") as Skill;
                      const clb = rawScoreToClb(profile[key], profile.spouse_lang_test, skill);
                      return (
                        <div key={key}>
                          <label className="text-xs text-gray-500 mb-1 block capitalize">
                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                            <span className="text-gray-600 ml-1">CLB {clb}</span>
                          </label>
                          <select value={profile[key]} onChange={e => update(key, Number(e.target.value))}
                            className="canada-input py-2 text-sm">
                            {optionsFor(profile.spouse_lang_test, skill).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Spouse Canadian Work Experience</label>
                  <select value={profile.spouse_canada_work_years} onChange={e => update("spouse_canada_work_years", Number(e.target.value))} className="canada-input py-2 text-sm">
                    {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v === 0 ? "None" : `${v} year${v > 1 ? "s" : ""}`}</option>)}
                  </select>
                </div>

                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg px-3 py-2 text-xs text-blue-300">
                  Spouse factors contribute <strong>+{breakdown.spouse}</strong> points to your total CRS score
                </div>
              </div>
            )}

            {/* Work Experience */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-base">💼 Work Experience</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Canadian Work Experience</label>
                  <select value={profile.canada_work_years} onChange={e => update("canada_work_years", Number(e.target.value))} className="canada-input py-2 text-sm">
                    {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v === 0 ? "None" : `${v} year${v > 1 ? "s" : ""}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Foreign Work Experience</label>
                  <select value={profile.foreign_work_years} onChange={e => update("foreign_work_years", Number(e.target.value))} className="canada-input py-2 text-sm">
                    {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v === 0 ? "None" : `${v} year${v > 1 ? "s" : ""}`}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Factors */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-base">⭐ Additional Factors</h2>

              {/* Job offer — tiered (200 vs 50 vs 0) */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Valid Canadian Job Offer</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { val: "none", label: "None", pts: "0" },
                    { val: "noc_teer_0_major_00", label: "TEER 0 Major Group 00 (CEO/CFO/GM)", pts: "+200" },
                    { val: "noc_teer_0_1_2_3", label: "Other valid NOC TEER 0/1/2/3", pts: "+50" },
                  ] as const).map(({ val, label, pts }) => (
                    <button key={val} onClick={() => update("job_offer_tier", val)}
                      className={`canada-pill text-xs ${profile.job_offer_tier === val ? "active" : ""}`}>
                      {label} <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canadian education — tiered (15 vs 30) */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Canadian Post-Secondary Education</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { val: "none", label: "None", pts: "0" },
                    { val: "one_or_two_year", label: "1–2 year program", pts: "+15" },
                    { val: "three_year_plus", label: "3+ year program", pts: "+30" },
                  ] as const).map(({ val, label, pts }) => (
                    <button key={val} onClick={() => update("canadian_education_tier", val)}
                      className={`canada-pill text-xs ${profile.canadian_education_tier === val ? "active" : ""}`}>
                      {label} <span className="ml-1 opacity-70">{pts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean factors that don't have tiers */}
              {([
                { key: "has_provincial_nomination" as const, label: "Provincial Nomination (PNP)", points: "+600" },
                { key: "has_canadian_sibling" as const, label: "Sibling who is a Canadian citizen or PR", points: "+15" },
              ]).map(({ key, label, points }) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={profile[key]} onChange={e => update(key, e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  </div>
                  <span className="text-xs text-green-400 font-semibold whitespace-nowrap">{points} pts</span>
                </label>
              ))}
            </div>

            <button onClick={saveProfile} disabled={saving} className="canada-btn w-full" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : saved ? "✓ Profile Saved" : "Save My Profile"}
            </button>
          </div>

          {/* ── RIGHT: Score ── */}
          <div className="space-y-5">

            {/* CRS Score */}
            <div className="canada-card p-6 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your CRS Score</p>
              <div className="text-6xl font-bold mb-2" style={{ color: scoreColor }}>{crsScore}</div>
              <div className="text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4"
                style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}60` }}>
                {isEligible ? "✓ Above Cut-off" : gap <= 50 ? `⚠ ${gap} pts below` : `✕ ${gap} pts below`}
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(crsScore / 1200) * 100}%`, background: scoreColor }} />
              </div>

              {/* Score breakdown */}
              <div className="text-left space-y-1.5 text-xs border-t border-white/10 pt-4 mt-2">
                {[
                  { label: "Age", val: breakdown.age },
                  { label: "Education", val: breakdown.education },
                  { label: "Language", val: breakdown.language },
                  { label: "Canadian Work Exp.", val: breakdown.canadaWork },
                  hasSpouse ? { label: "Spouse Factors", val: breakdown.spouse } : null,
                  { label: "Skill Transferability", val: breakdown.transferability },
                  { label: "Additional Points", val: breakdown.additional },
                ].filter(Boolean).map((item) => (
                  <div key={item!.label} className="flex justify-between">
                    <span className="text-gray-400">{item!.label}</span>
                    <span className={`font-semibold ${item!.val > 0 ? "text-white" : "text-gray-600"}`}>{item!.val}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                  <span className="text-gray-300 font-semibold">Total</span>
                  <span className="font-bold" style={{ color: scoreColor }}>{crsScore}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-400">
                    Latest cut-off
                    {latestDrawDate && (
                      <span className="text-[10px] text-gray-600 ml-1">
                        · {new Date(latestDrawDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </span>
                  <span className="text-yellow-400 font-bold">{latestCutoff}</span>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div className="canada-card p-5">
              <h3 className="font-semibold text-sm mb-2">{isEligible ? "🎉 PR Eligible!" : "📋 PR Status"}</h3>
              {isEligible ? (
                <p className="text-xs text-green-300 leading-relaxed">
                  Your score is above the latest Express Entry cut-off. You may receive an ITA in the next draw. Keep your IRCC profile updated.
                </p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  You need <span className="text-white font-semibold">{gap} more points</span> to reach the latest cut-off of <span className="text-yellow-400 font-semibold">{latestCutoff}</span>.
                </p>
              )}
              {latestDrawDate && (() => {
                const days = Math.floor((Date.now() - new Date(latestDrawDate).getTime()) / 86_400_000);
                if (days <= 30) return null;
                return (
                  <p className="text-[11px] text-yellow-400 mt-2 leading-relaxed">
                    ⚠ The latest draw on file is {days} days old. IRCC may have published newer draws —{" "}
                    <a href="/draws" className="underline hover:text-yellow-300">check /draws</a> for the latest cut-off.
                  </p>
                );
              })()}
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="canada-card p-5">
                <h3 className="font-semibold text-sm mb-3">💡 How to Improve</h3>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed border-l-2 border-red-800 pl-3">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="canada-card p-5 space-y-2">
              <h3 className="font-semibold text-sm mb-3">🔗 Quick Links</h3>
              <a href="/draws" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5 border-b border-white/5">
                <span>📊 View all PR draws</span><span>→</span>
              </a>
              <a href="/crs" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5 border-b border-white/5">
                <span>🧮 Detailed CRS Calculator</span><span>→</span>
              </a>
              <a href="/processing" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5">
                <span>⏱ Check processing times</span><span>→</span>
              </a>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              This dashboard is a self-assessment based on IRCC&apos;s published CRS formula — not legal advice or an IRCC determination. Only IRCC&apos;s official assessment confirms your eligibility. Your saved profile is private to your account.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
