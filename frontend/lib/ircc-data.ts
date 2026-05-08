// IRCC reference data — numbers IRCC publishes that change on a known cadence.
// Every dataset has a `lastVerified` date and a `source` URL so users can sanity-check.
//
// HOW TO UPDATE:
//   1. Open the source URL in the entry below.
//   2. If the value changed, update it and bump `lastVerified` to today (YYYY-MM-DD).
//   3. If the value is unchanged, just bump `lastVerified` to today.
//   4. The DataFreshness banner auto-warns if the date is older than the cadence
//      window (annual = 365d, quarterly = 120d, monthly = 45d).
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

/* ─── Proof of Funds — Federal Skilled Worker / FST (Express Entry) ──────────
   IRCC publishes a new table around June 1 each year (LICO + 50%).
   Values below are the most recently confirmed table. When IRCC publishes a
   new annual update, edit the amounts AND bump `lastVerified` together.       */
export const FSW_FUNDS: DataSet<{ amounts: Record<number, number>; extra: number }> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
  sourceLabel: "canada.ca · Proof of funds",
  cadence: "annually",
  note: "IRCC publishes a new table each June. Always confirm the current amount on canada.ca before submitting your application.",
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
   since 2000). IRCC said it would adjust annually using StatsCan LICO.         */
export const STUDY_LIVING: DataSet<{ singlePerYear: number; perAdditional: number }> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/news/2023/12/revised-cost-of-living-financial-requirement-for-international-students-to-better-set-them-up-for-success.html",
  sourceLabel: "canada.ca · Study permit funds",
  cadence: "annually",
  note: "IRCC's cost-of-living floor is reviewed annually against Statistics Canada's LICO. Confirm the current amount on canada.ca.",
  data: {
    singlePerYear: 20635,
    // approximate add-on per accompanying family member (not officially fixed but commonly cited)
    perAdditional: 4200,
  },
};

/* ─── PR Card / TR processing time fallbacks ─────────────────────────────────
   These are fallbacks for the /tracker UI. Real wait-times for visa
   applications-by-country live in Supabase (`processing_times`). IRCC
   refreshes the public processing-time tracker on a rolling weekly basis.      */
export const PERMIT_PROCESSING_FALLBACK: DataSet<Record<
  "work" | "study" | "visitor" | "pr_card",
  { weeks: number; renewDaysBefore: number }
>> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html",
  sourceLabel: "canada.ca · Processing times",
  cadence: "quarterly",
  note: "IRCC processing times shift weekly. The numbers shown are typical estimates — always check the IRCC tool for your specific case.",
  data: {
    work:    { weeks: 12, renewDaysBefore: 90 },
    study:   { weeks: 16, renewDaysBefore: 90 },
    visitor: { weeks: 4,  renewDaysBefore: 30 },
    pr_card: { weeks: 60, renewDaysBefore: 180 },
  },
};

/* ─── Language test → CLB conversion tables ──────────────────────────────────
   These don't change often. Re-verify yearly against the IRCC equivalency
   charts.                                                                      */
export const CLB_TABLES: DataSet<true> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/test-equivalency-charts.html",
  sourceLabel: "canada.ca · Test equivalency charts",
  cadence: "as-needed",
  note: "IRCC test-equivalency charts. CLB 7+ is the minimum for FSW and CEC; CLB 9+ earns full CRS language points.",
  data: true,
};

/* ─── NOC 2021 occupation list ───────────────────────────────────────────────
   IRCC uses Statistics Canada's NOC 2021. New revisions roll out roughly
   every 5 years.                                                               */
export const NOC_DATASET: DataSet<true> = {
  lastVerified: "2026-05-08",
  source: "https://noc.esdc.gc.ca/",
  sourceLabel: "noc.esdc.gc.ca · Full NOC 2021 search",
  cadence: "as-needed",
  note: "We list common Express Entry-eligible occupations. The full NOC has 500+ codes — use the official search if yours isn't here.",
  data: true,
};

/* ─── Provincial Nominee Programs ────────────────────────────────────────────
   PNP rules and CRS thresholds change frequently. Treat the per-stream
   thresholds as guidance only — most provinces don't publish them officially.  */
export const PNP_DATASET: DataSet<true> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html",
  sourceLabel: "canada.ca · Provincial Nominees",
  cadence: "monthly",
  note: "Provincial streams open and close frequently. Always check the province's own site before applying.",
  data: true,
};

/* ─── CRS scoring formula ────────────────────────────────────────────────────
   The CRS formula in /crs/page.tsx is IRCC's official formula. IRCC has not
   modified it materially since 2017 but has tweaked weights occasionally.
   Re-verify whenever IRCC announces a CRS change.                              */
export const CRS_FORMULA: DataSet<true> = {
  lastVerified: "2026-05-08",
  source: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html",
  sourceLabel: "canada.ca · CRS scoring grid",
  cadence: "as-needed",
  note: "IRCC publishes the full point grid. Verify against the official table before submitting your Express Entry profile.",
  data: true,
};

/* ─── Currency reference rates ───────────────────────────────────────────────
   Static reference rates so the funds page can show "≈ X INR / X PHP".
   Real applicants should use a live FX rate at application time.               */
export const FX_RATES: DataSet<Record<string, { label: string; flag: string; rate: number }>> = {
  lastVerified: "2026-05-08",
  source: "https://www.bankofcanada.ca/rates/exchange/",
  sourceLabel: "Bank of Canada · Daily exchange rates",
  cadence: "as-needed",
  note: "Rates shown are for rough conversion only. Use a live FX rate and certified bank statements when applying.",
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
