// CRS scoring tables — single source of truth for the official IRCC grid.
//
// All numeric values come directly from IRCC's published Comprehensive Ranking
// System grid. Both /crs and /dashboard import from here; previously each page
// kept its own copy and the two had drifted in subtle ways. To update:
//
//   1. Open the IRCC source URL in lib/ircc-data.ts → CRS_FORMULA.source
//   2. Change the numbers below.
//   3. Bump CRS_FORMULA.lastVerified in lib/ircc-data.ts.
//
// Each lookup helper takes a `hasSpouse` flag and returns the right column.

export type EducationLevel =
  | "less_than_secondary"
  | "secondary"
  | "one_year_diploma"
  | "two_year_diploma"
  | "bachelors_or_3yr"
  | "two_or_more_certs"
  | "masters"
  | "doctoral";

export type LangTest = "ielts" | "celpip";

export type Skill = "listening" | "reading" | "writing" | "speaking";

export type CLBScores = {
  reading: number;
  writing: number;
  listening: number;
  speaking: number;
};

/** [no_spouse, with_spouse] — common shape for the spouse-dependent tables. */
type Pair = [noSpouse: number, withSpouse: number];

function minClb(scores: CLBScores): number {
  return Math.min(scores.reading, scores.writing, scores.listening, scores.speaking);
}

const HIGH_EDU: EducationLevel[] = [
  "bachelors_or_3yr", "two_or_more_certs", "masters", "doctoral",
];
const POST_SECONDARY_EDU: EducationLevel[] = [
  "one_year_diploma", "two_year_diploma", ...HIGH_EDU,
];

// ─── A. Core human capital ──────────────────────────────────────────────────

const AGE_POINTS: Record<number, Pair> = {
  17: [0, 0],
  18: [99, 90],
  19: [105, 95],
  20: [110, 100], 21: [110, 100], 22: [110, 100], 23: [110, 100],
  24: [110, 100], 25: [110, 100], 26: [110, 100], 27: [110, 100],
  28: [110, 100], 29: [110, 100],
  30: [105, 95],
  31: [99, 90], 32: [94, 85], 33: [88, 80], 34: [83, 75],
  35: [77, 70], 36: [72, 65], 37: [66, 60], 38: [61, 55],
  39: [55, 50], 40: [50, 45],
  41: [39, 35], 42: [28, 25], 43: [17, 15], 44: [6, 5],
  45: [0, 0],
};

export function getAgePoints(age: number, hasSpouse: boolean): number {
  const clamped = age <= 17 ? 17 : age >= 45 ? 45 : age;
  const pair = AGE_POINTS[clamped];
  return pair ? pair[hasSpouse ? 1 : 0] : 0;
}

const EDUCATION_POINTS: Record<EducationLevel, Pair> = {
  less_than_secondary: [0, 0],
  secondary: [30, 28],
  one_year_diploma: [90, 84],
  two_year_diploma: [98, 91],
  bachelors_or_3yr: [120, 112],
  two_or_more_certs: [128, 119],
  masters: [135, 126],
  doctoral: [150, 140],
};

export function getEducationPoints(level: EducationLevel, hasSpouse: boolean): number {
  const pair = EDUCATION_POINTS[level];
  return pair ? pair[hasSpouse ? 1 : 0] : 0;
}

/** First official language — per skill (max 4 skills, max 32 with spouse / 34 without). */
const FIRST_LANG_PER_SKILL: Record<number, Pair> = {
  4: [6, 6], 5: [6, 6], 6: [9, 8], 7: [17, 16], 8: [23, 22], 9: [31, 29], 10: [34, 32],
};

export function getFirstLangPoints(clb: number, hasSpouse: boolean): number {
  if (clb < 4) return 0;
  const capped = Math.min(10, Math.max(4, Math.round(clb)));
  const pair = FIRST_LANG_PER_SKILL[capped];
  return pair ? pair[hasSpouse ? 1 : 0] : 0;
}

/** Second official language — per skill, capped at 24 total across all 4 skills. */
const SECOND_LANG_PER_SKILL: Record<number, number> = {
  4: 0, 5: 1, 6: 1, 7: 3, 8: 3, 9: 6, 10: 6,
};
export const SECOND_LANG_TOTAL_CAP = 24;

export function getSecondLangPoints(clb: number): number {
  if (clb < 5) return 0;
  return SECOND_LANG_PER_SKILL[Math.min(10, Math.round(clb))] ?? 0;
}

/** Canadian work experience (years 0–5+). */
const CANADIAN_WORK_POINTS: Record<number, Pair> = {
  0: [0, 0], 1: [40, 35], 2: [53, 46], 3: [64, 56], 4: [72, 63], 5: [80, 70],
};

export function getCanadianWorkPoints(years: number, hasSpouse: boolean): number {
  const clamped = Math.min(5, Math.max(0, Math.round(years)));
  const pair = CANADIAN_WORK_POINTS[clamped];
  return pair ? pair[hasSpouse ? 1 : 0] : 0;
}

// ─── B. Spouse / common-law partner factors ─────────────────────────────────

const SPOUSE_EDUCATION_POINTS: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 2,
  one_year_diploma: 6,
  two_year_diploma: 7,
  bachelors_or_3yr: 8,
  two_or_more_certs: 9,
  masters: 10,
  doctoral: 10,
};

export function getSpouseEducationPoints(level: EducationLevel): number {
  return SPOUSE_EDUCATION_POINTS[level] ?? 0;
}

const SPOUSE_LANG_PER_SKILL: Record<number, number> = {
  4: 0, 5: 1, 6: 1, 7: 3, 8: 3, 9: 5, 10: 5,
};

export function getSpouseLangPoints(clb: number): number {
  if (clb < 5) return 0;
  return SPOUSE_LANG_PER_SKILL[Math.min(10, Math.round(clb))] ?? 0;
}

const SPOUSE_CANADIAN_WORK_POINTS: Record<number, number> = {
  0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10,
};

export function getSpouseCanadianWorkPoints(years: number): number {
  const clamped = Math.min(5, Math.max(0, Math.round(years)));
  return SPOUSE_CANADIAN_WORK_POINTS[clamped] ?? 0;
}

// ─── IELTS / CELPIP → CLB conversion ────────────────────────────────────────
// IRCC's official equivalency for IELTS General Training is per-skill — the
// thresholds for Listening, Reading, Writing, and Speaking are different from
// each other, so the same band score maps to different CLB values depending
// on which skill it belongs to. CELPIP is already on the CLB scale.

const IELTS_GT_TO_CLB: Record<Skill, ReadonlyArray<{ min: number; clb: number }>> = {
  // Each table is sorted highest → lowest; first match wins.
  listening: [
    { min: 8.5, clb: 10 }, { min: 8.0, clb: 9 }, { min: 7.5, clb: 8 },
    { min: 6.0, clb: 7 },  { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 },
    { min: 4.5, clb: 4 },
  ],
  reading: [
    { min: 8.0, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 },
    { min: 6.0, clb: 7 },  { min: 5.0, clb: 6 }, { min: 4.0, clb: 5 },
    { min: 3.5, clb: 4 },
  ],
  writing: [
    { min: 7.5, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 },
    { min: 6.0, clb: 7 },  { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 },
    { min: 4.0, clb: 4 },
  ],
  speaking: [
    { min: 7.5, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 },
    { min: 6.0, clb: 7 },  { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 },
    { min: 4.0, clb: 4 },
  ],
};

export function rawScoreToClb(raw: number, test: LangTest, skill: Skill): number {
  if (test === "celpip") return Math.min(10, Math.max(1, Math.round(raw)));
  for (const { min, clb } of IELTS_GT_TO_CLB[skill]) {
    if (raw >= min) return clb;
  }
  return 0;
}

// ─── Re-exports for back-compat with /crs's record-based lookups ─────────────
// These keep the /crs UI tables (which iterate over { CLB → points } entries
// to render the scoring grids) working without restructuring the JSX.

export const FIRST_LANG_NO_SPOUSE: Record<number, number> = Object.fromEntries(
  Object.entries(FIRST_LANG_PER_SKILL).map(([clb, [no]]) => [Number(clb), no])
);
export const FIRST_LANG_WITH_SPOUSE: Record<number, number> = Object.fromEntries(
  Object.entries(FIRST_LANG_PER_SKILL).map(([clb, [, withS]]) => [Number(clb), withS])
);
export const SECOND_LANG_SCORES = SECOND_LANG_PER_SKILL;
export const CANADIAN_WORK_NO_SPOUSE: Record<number, number> = Object.fromEntries(
  Object.entries(CANADIAN_WORK_POINTS).map(([y, [no]]) => [Number(y), no])
);
export const CANADIAN_WORK_WITH_SPOUSE: Record<number, number> = Object.fromEntries(
  Object.entries(CANADIAN_WORK_POINTS).map(([y, [, withS]]) => [Number(y), withS])
);
export const EDUCATION_SCORES_NO_SPOUSE: Record<EducationLevel, number> = Object.fromEntries(
  Object.entries(EDUCATION_POINTS).map(([k, [no]]) => [k, no])
) as Record<EducationLevel, number>;
export const EDUCATION_SCORES_WITH_SPOUSE: Record<EducationLevel, number> = Object.fromEntries(
  Object.entries(EDUCATION_POINTS).map(([k, [, withS]]) => [k, withS])
) as Record<EducationLevel, number>;
export const AGE_SCORES_NO_SPOUSE: Record<string, number> = (() => {
  const out: Record<string, number> = { "17_or_less": 0, "45_or_more": 0 };
  for (const [age, [no]] of Object.entries(AGE_POINTS)) {
    if (age === "17" || age === "45") continue;
    out[age] = no;
  }
  return out;
})();
export const AGE_SCORES_WITH_SPOUSE: Record<string, number> = (() => {
  const out: Record<string, number> = { "17_or_less": 0, "45_or_more": 0 };
  for (const [age, [, withS]] of Object.entries(AGE_POINTS)) {
    if (age === "17" || age === "45") continue;
    out[age] = withS;
  }
  return out;
})();
export const SPOUSE_EDUCATION_SCORES = SPOUSE_EDUCATION_POINTS;
export const SPOUSE_LANG_SCORES = SPOUSE_LANG_PER_SKILL;
export const SPOUSE_CANADIAN_WORK_SCORES = SPOUSE_CANADIAN_WORK_POINTS;

// ─── C. Skill transferability (max 100) ─────────────────────────────────────
// Each of the three groups (education, foreign work, trades cert) caps at 50,
// and the overall total then caps at 100. Both /crs and /dashboard call
// computeSkillTransferability so the sub-caps are applied identically.

export function getEducationPlusLangPoints(
  education: EducationLevel,
  firstLangCLB: CLBScores,
): number {
  if (!POST_SECONDARY_EDU.includes(education)) return 0;
  const m = minClb(firstLangCLB);
  if (m < 7) return 0;
  const isHighEdu = HIGH_EDU.includes(education);
  if (m >= 9) return isHighEdu ? 50 : 25;
  return isHighEdu ? 25 : 13;
}

export function getEducationPlusCanadianWorkPoints(
  education: EducationLevel,
  canadianWorkYears: number,
): number {
  if (!POST_SECONDARY_EDU.includes(education)) return 0;
  if (canadianWorkYears < 1) return 0;
  const isHighEdu = HIGH_EDU.includes(education);
  if (canadianWorkYears >= 2) return isHighEdu ? 50 : 25;
  return isHighEdu ? 25 : 13;
}

export function getForeignWorkPlusLangPoints(
  foreignWorkYears: number,
  firstLangCLB: CLBScores,
): number {
  if (foreignWorkYears < 1) return 0;
  const m = minClb(firstLangCLB);
  if (m < 7) return 0;
  if (foreignWorkYears >= 3) return m >= 9 ? 50 : 25;
  return m >= 9 ? 25 : 13;
}

export function getForeignPlusCanadianWorkPoints(
  foreignWorkYears: number,
  canadianWorkYears: number,
): number {
  if (foreignWorkYears < 1 || canadianWorkYears < 1) return 0;
  if (foreignWorkYears >= 3 && canadianWorkYears >= 2) return 50;
  if (foreignWorkYears >= 3 || canadianWorkYears >= 2) return 25;
  return 13;
}

/** Certificate of qualification (in a trade, issued by a Canadian province). */
export function getTradesCertificatePlusLangPoints(
  hasCertificate: boolean,
  firstLangCLB: CLBScores,
): number {
  if (!hasCertificate) return 0;
  const m = minClb(firstLangCLB);
  if (m < 5) return 0;
  if (m >= 7) return 50;
  return 25;
}

export type TransferabilityInput = {
  education: EducationLevel;
  firstLangCLB: CLBScores;
  canadianWorkYears: number;
  foreignWorkYears: number;
  hasTradesCertificate?: boolean;
};

export type TransferabilityResult = {
  total: number;
  details: {
    eduLang: number;
    eduWork: number;
    foreignLang: number;
    foreignCanadian: number;
    tradesLang: number;
    educationGroup: number;     // capped at 50
    foreignWorkGroup: number;   // capped at 50
    tradesGroup: number;         // capped at 50 (trades cert is its own group)
  };
};

/**
 * IRCC has 3 sub-caps (50 each) before the overall 100 cap:
 *   - Education group:    Edu+Lang + Edu+CanWork
 *   - Foreign work group: Foreign+Lang + Foreign+CanWork
 *   - Trades cert group:  Cert+Lang
 * The previous /crs implementation skipped the sub-caps and only applied the
 * overall 100 cap, which silently inflated some profiles by up to 50 points.
 */
export function computeSkillTransferability(input: TransferabilityInput): TransferabilityResult {
  const eduLang = getEducationPlusLangPoints(input.education, input.firstLangCLB);
  const eduWork = getEducationPlusCanadianWorkPoints(input.education, input.canadianWorkYears);
  const foreignLang = getForeignWorkPlusLangPoints(input.foreignWorkYears, input.firstLangCLB);
  const foreignCanadian = getForeignPlusCanadianWorkPoints(
    input.foreignWorkYears, input.canadianWorkYears,
  );
  const tradesLang = getTradesCertificatePlusLangPoints(
    input.hasTradesCertificate ?? false, input.firstLangCLB,
  );

  const educationGroup = Math.min(50, eduLang + eduWork);
  const foreignWorkGroup = Math.min(50, foreignLang + foreignCanadian);
  const tradesGroup = Math.min(50, tradesLang);

  const total = Math.min(100, educationGroup + foreignWorkGroup + tradesGroup);

  return {
    total,
    details: {
      eduLang, eduWork, foreignLang, foreignCanadian, tradesLang,
      educationGroup, foreignWorkGroup, tradesGroup,
    },
  };
}

// ─── D. Additional points ───────────────────────────────────────────────────

export type FrenchBonusTier =
  | "none"                          // No French OR French below CLB 7 in any skill
  | "clb7_french_low_english"       // French CLB 7+ all skills + English CLB 4 or below (or no English)
  | "clb7_french_strong_english";   // French CLB 7+ all skills + English CLB 5+ all skills

/**
 * IRCC updated these in October 2022 (used to be 15/30, now 25/50).
 * Cap: 50 pts. The "strong English" tier rewards true bilingual candidates.
 */
export function getFrenchBonusPoints(tier: FrenchBonusTier): number {
  if (tier === "clb7_french_strong_english") return 50;
  if (tier === "clb7_french_low_english") return 25;
  return 0;
}

export type JobOfferTier =
  | "none"
  | "noc_teer_0_major_00"   // Senior management — 200 pts
  | "noc_teer_0_1_2_3";     // Other valid NOC — 50 pts

export function getJobOfferPoints(tier: JobOfferTier): number {
  if (tier === "noc_teer_0_major_00") return 200;
  if (tier === "noc_teer_0_1_2_3") return 50;
  return 0;
}

export type CanadianEducationTier = "none" | "one_or_two_year" | "three_year_plus";

export function getCanadianEducationPoints(tier: CanadianEducationTier): number {
  if (tier === "three_year_plus") return 30;
  if (tier === "one_or_two_year") return 15;
  return 0;
}
