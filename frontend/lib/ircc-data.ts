// IRCC reference data — numbers IRCC publishes that change on a known cadence.
// Every dataset has a `lastVerified` date and a `source` URL so users can sanity-check.
//
// HOW TO UPDATE:
//   1. Open the source URL in the entry below.
//   2. If the value changed, update it and bump `lastVerified` to today (YYYY-MM-DD).
//   3. If the value is unchanged, just bump `lastVerified` to today.
//
// Components import these via DataFreshness so the UI always shows the source + date.

export type DataSet<T> = {
  /** Last time a human verified these numbers against the IRCC source. */
  lastVerified: string;
  /** Direct link to the IRCC page where this data is published. */
  source: string;
  /** Short label for source link, e.g. "canada.ca · Proof of funds". */
  sourceLabel: string;
  /** How often IRCC typically updates this. Used in disclaimer copy. */
  cadence: "annually" | "quarterly" | "monthly" | "as-needed";
  /** Optional note shown beside the source link. */
  note?: string;
  data: T;
};

/* ─── Proof of Funds — Federal Skilled Worker / CEC (Express Entry) ──────────
   IRCC publishes a new table around June 1 each year (LICO + 50%).            */
export const FSW_FUNDS: DataSet<{ amounts: Record<number, number>; extra: number }> = {
  lastVerified: "2024-06-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
  sourceLabel: "canada.ca · Proof of funds",
  cadence: "annually",
  note: "IRCC updates these amounts every June. Verify the current table before submitting your application.",
  data: {
    amounts: {
      1: 14690,
      2: 18288,
      3: 22483,
      4: 27297,
      5: 30690,
      6: 34917,
      7: 38875,
    },
    // per additional family member beyond 7
    extra: 3958,
  },
};

/* ─── Study Permit — minimum cost-of-living (single applicant) ───────────────
   Raised from $10,000 to $20,635 effective 2024-01-01 (first major update
   since 2000). IRCC says it will adjust annually using StatsCan LICO.          */
export const STUDY_LIVING: DataSet<{ singlePerYear: number; perAdditional: number }> = {
  lastVerified: "2024-01-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/news/2023/12/revised-cost-of-living-financial-requirement-for-international-students-to-better-set-them-up-for-success.html",
  sourceLabel: "canada.ca · Study permit funds",
  cadence: "annually",
  note: "IRCC raised the cost-of-living floor to $20,635/yr for single applicants effective 2024-01-01 and will adjust annually.",
  data: {
    singlePerYear: 20635,
    // approximate add-on per accompanying family member (not officially fixed but commonly cited)
    perAdditional: 4200,
  },
};

/* ─── PR Card / TR processing time fallbacks ─────────────────────────────────
   These are fallbacks ONLY. The /tracker page should prefer the live values
   we already scrape into Supabase (`processing_times` / `latest_processing_times`).
   If a category is missing from Supabase, fall back to these.                  */
export const PERMIT_PROCESSING_FALLBACK: DataSet<Record<
  "work" | "study" | "visitor" | "pr_card",
  { weeks: number; renewDaysBefore: number }
>> = {
  lastVerified: "2024-09-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html",
  sourceLabel: "canada.ca · Processing times",
  cadence: "quarterly",
  note: "IRCC processing times shift weekly. The tracker uses live data when available; these are fallback estimates.",
  data: {
    work:    { weeks: 12, renewDaysBefore: 90 },
    study:   { weeks: 16, renewDaysBefore: 90 },
    visitor: { weeks: 4,  renewDaysBefore: 30 },
    pr_card: { weeks: 60, renewDaysBefore: 180 },
  },
};

/* ─── Language test → CLB conversion tables ──────────────────────────────────
   These do not change often but are worth re-verifying yearly.                 */
export const CLB_TABLES: DataSet<true> = {
  lastVerified: "2024-09-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/test-equivalency-charts.html",
  sourceLabel: "canada.ca · Test equivalency charts",
  cadence: "as-needed",
  note: "Conversion tables published by IRCC. CLB 7+ is the minimum for FSW and CEC.",
  data: true,
};

/* ─── NOC 2021 occupation list ───────────────────────────────────────────────
   IRCC uses the Statistics Canada NOC 2021 v1.0. New revisions release
   roughly every 5 years.                                                       */
export const NOC_DATASET: DataSet<true> = {
  lastVerified: "2024-09-01",
  source: "https://noc.esdc.gc.ca/",
  sourceLabel: "noc.esdc.gc.ca · Full NOC 2021 search",
  cadence: "as-needed",
  note: "We list common Express Entry-eligible occupations. The full NOC has 500+ codes — use the official search if yours isn't here.",
  data: true,
};

/* ─── Provincial Nominee Programs ────────────────────────────────────────────
   PNP rules and CRS thresholds change monthly. Treat thresholds as guidance
   only — provinces don't always publish them.                                  */
export const PNP_DATASET: DataSet<true> = {
  lastVerified: "2024-09-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html",
  sourceLabel: "canada.ca · Provincial Nominees",
  cadence: "monthly",
  note: "Provincial streams open and close frequently. Always check the province's own site before applying.",
  data: true,
};

/* ─── CRS scoring formula ────────────────────────────────────────────────────
   The CRS formula in /crs/page.tsx is the official IRCC formula. IRCC has not
   modified it since 2017 but has historically tweaked weights; re-verify on
   any IRCC announcement.                                                       */
export const CRS_FORMULA: DataSet<true> = {
  lastVerified: "2024-09-01",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html",
  sourceLabel: "canada.ca · CRS scoring grid",
  cadence: "as-needed",
  note: "IRCC publishes the full point grid. Verify against the official table before submitting your Express Entry profile.",
  data: true,
};

/* ─── Currency reference rates ───────────────────────────────────────────────
   These are static reference rates so the funds page can show "approximately
   X INR / X PHP". Real users should use a live FX rate at application time.    */
export const FX_RATES: DataSet<Record<string, { label: string; flag: string; rate: number }>> = {
  lastVerified: "2024-09-01",
  source: "https://www.bankofcanada.ca/rates/exchange/",
  sourceLabel: "Bank of Canada · Daily exchange rates",
  cadence: "as-needed",
  note: "Rates shown are for rough conversion only. Use live FX rates and certified bank statements when applying.",
  data: {
    CAD: { label: "Canadian Dollar", flag: "🇨🇦", rate: 1 },
    USD: { label: "US Dollar",       flag: "🇺🇸", rate: 0.74 },
    INR: { label: "Indian Rupee",    flag: "🇮🇳", rate: 61.5 },
    PHP: { label: "Philippine Peso", flag: "🇵🇭", rate: 41.2 },
    NGN: { label: "Nigerian Naira",  flag: "🇳🇬", rate: 1235 },
    PKR: { label: "Pakistani Rupee", flag: "🇵🇰", rate: 206 },
    GBP: { label: "British Pound",   flag: "🇬🇧", rate: 0.58 },
    BDT: { label: "Bangladeshi Taka", flag: "🇧🇩", rate: 81.5 },
    CNY: { label: "Chinese Yuan",    flag: "🇨🇳", rate: 5.35 },
    MXN: { label: "Mexican Peso",    flag: "🇲🇽", rate: 12.6 },
  },
};
