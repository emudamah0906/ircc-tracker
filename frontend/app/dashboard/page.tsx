"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import type { User } from "@supabase/supabase-js";

type LangTest = "ielts" | "celpip";

type Profile = {
  age: number;
  marital_status: "single" | "married";
  education: string;
  lang_test: LangTest;
  first_lang_reading: number;
  first_lang_writing: number;
  first_lang_listening: number;
  first_lang_speaking: number;
  canada_work_years: number;
  foreign_work_years: number;
  has_canadian_education: boolean;
  has_provincial_nomination: boolean;
  has_job_offer: boolean;
  has_canadian_sibling: boolean;
  // Spouse
  spouse_education: string;
  spouse_lang_reading: number;
  spouse_lang_writing: number;
  spouse_lang_listening: number;
  spouse_lang_speaking: number;
  spouse_canada_work_years: number;
};

const DEFAULT_PROFILE: Profile = {
  age: 28,
  marital_status: "single",
  education: "bachelors",
  lang_test: "ielts",
  first_lang_reading: 7,
  first_lang_writing: 7,
  first_lang_listening: 7,
  first_lang_speaking: 7,
  canada_work_years: 0,
  foreign_work_years: 1,
  has_canadian_education: false,
  has_provincial_nomination: false,
  has_job_offer: false,
  has_canadian_sibling: false,
  spouse_education: "bachelors",
  spouse_lang_reading: 5,
  spouse_lang_writing: 5,
  spouse_lang_listening: 5,
  spouse_lang_speaking: 5,
  spouse_canada_work_years: 0,
};

// ── Language score → CLB conversion ─────────────────────────────────────────
function toClb(score: number, test: LangTest): number {
  if (test === "celpip") {
    // CELPIP score is directly CLB (1–12, cap at 10)
    return Math.min(10, Math.max(1, Math.round(score)));
  }
  // IELTS General → CLB (simplified, per IRCC official table)
  if (score >= 8.5) return 10;
  if (score >= 8.0) return 9;
  if (score >= 7.0) return 8;
  if (score >= 6.5) return 7;
  if (score >= 6.0) return 6;
  if (score >= 5.5) return 5;
  if (score >= 5.0) return 4;
  return 3;
}

// ── CRS Calculation ───────────────────────────────────────────────────────────
function calcCRS(p: Profile): { total: number; breakdown: Record<string, number> } {
  const hasSpouse = p.marital_status === "married";
  const breakdown: Record<string, number> = {};

  // ── A: Core Human Capital ────────────────────────────────────────────────
  const agePoints: Record<number, [number, number]> = {
    17: [0,0], 18: [99,90], 19: [105,95], 20: [110,100], 21: [110,100],
    22: [110,100], 23: [110,100], 24: [110,100], 25: [110,100], 26: [110,100],
    27: [110,100], 28: [110,100], 29: [110,100], 30: [105,95], 31: [99,90],
    32: [94,85], 33: [88,80], 34: [83,75], 35: [77,70], 36: [72,65],
    37: [66,60], 38: [61,55], 39: [55,50], 40: [50,45], 41: [39,35],
    42: [28,25], 43: [17,15], 44: [6,5],
  };
  const ageKey = Math.min(44, Math.max(17, p.age));
  breakdown.age = hasSpouse ? (agePoints[ageKey]?.[1] ?? 0) : (agePoints[ageKey]?.[0] ?? 0);

  const eduMap: Record<string, [number, number]> = {
    less_than_secondary: [0,0], secondary: [30,28], one_year_diploma: [90,84],
    two_year_diploma: [98,91], bachelors: [120,112], two_or_more_certs: [128,119],
    masters: [135,126], doctoral: [150,140],
  };
  breakdown.education = hasSpouse ? (eduMap[p.education]?.[1] ?? 120) : (eduMap[p.education]?.[0] ?? 120);

  // Language — first official language
  const r = toClb(p.first_lang_reading, p.lang_test);
  const w = toClb(p.first_lang_writing, p.lang_test);
  const l = toClb(p.first_lang_listening, p.lang_test);
  const s = toClb(p.first_lang_speaking, p.lang_test);

  const langMap: Record<number, [number, number]> = {
    10: [34,32], 9: [31,29], 8: [23,22], 7: [17,16], 6: [9,8], 5: [1,1],
  };
  const langPts = (clb: number) => hasSpouse ? (langMap[Math.min(10,clb)]?.[1] ?? 0) : (langMap[Math.min(10,clb)]?.[0] ?? 0);
  breakdown.language = langPts(r) + langPts(w) + langPts(l) + langPts(s);

  const canWorkMap: Record<number, [number, number]> = {
    0: [0,0], 1: [40,35], 2: [53,46], 3: [64,56], 4: [72,63], 5: [80,70],
  };
  breakdown.canadaWork = hasSpouse
    ? (canWorkMap[Math.min(5, p.canada_work_years)]?.[1] ?? 0)
    : (canWorkMap[Math.min(5, p.canada_work_years)]?.[0] ?? 0);

  // ── B: Spouse / Common-Law Partner Factors ───────────────────────────────
  breakdown.spouse = 0;
  if (hasSpouse) {
    // Spouse education (max 10)
    const spouseEduMap: Record<string, number> = {
      less_than_secondary: 0, secondary: 2, one_year_diploma: 6,
      two_year_diploma: 7, bachelors: 8, two_or_more_certs: 9,
      masters: 10, doctoral: 10,
    };
    breakdown.spouse += spouseEduMap[p.spouse_education] ?? 8;

    // Spouse language CLB (max 20 — 5 per skill)
    const spouseLangMap: Record<number, number> = { 10: 5, 9: 5, 8: 3, 7: 3, 6: 1, 5: 1 };
    const sr = toClb(p.spouse_lang_reading, p.lang_test);
    const sw = toClb(p.spouse_lang_writing, p.lang_test);
    const sl = toClb(p.spouse_lang_listening, p.lang_test);
    const ss = toClb(p.spouse_lang_speaking, p.lang_test);
    breakdown.spouse += (spouseLangMap[Math.min(10,sr)] ?? 0) + (spouseLangMap[Math.min(10,sw)] ?? 0)
      + (spouseLangMap[Math.min(10,sl)] ?? 0) + (spouseLangMap[Math.min(10,ss)] ?? 0);

    // Spouse Canadian work exp (max 10)
    const spouseWorkMap: Record<number, number> = { 0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10 };
    breakdown.spouse += spouseWorkMap[Math.min(5, p.spouse_canada_work_years)] ?? 0;
  }

  // ── C: Skill Transferability (max 100) ────────────────────────────────────
  let transferability = 0;
  const avgCLB = (r + w + l + s) / 4;
  const highEdu = ["bachelors", "two_or_more_certs", "masters", "doctoral"].includes(p.education);

  if (highEdu && avgCLB >= 9) transferability += 50;
  else if (highEdu && avgCLB >= 7) transferability += 25;

  if (highEdu && p.canada_work_years >= 1) transferability += 25;

  if (p.foreign_work_years >= 3 && p.canada_work_years >= 1) transferability += 25;
  else if (p.foreign_work_years >= 1 && p.canada_work_years >= 1) transferability += 13;

  if (p.foreign_work_years >= 3 && avgCLB >= 9) transferability += 50;
  else if (p.foreign_work_years >= 1 && avgCLB >= 7) transferability += 25;

  breakdown.transferability = Math.min(100, transferability);

  // ── D: Additional Points ─────────────────────────────────────────────────
  breakdown.additional = 0;
  if (p.has_provincial_nomination) breakdown.additional += 600;
  if (p.has_job_offer) breakdown.additional += 50;
  if (p.has_canadian_sibling) breakdown.additional += 15;
  if (p.has_canadian_education) breakdown.additional += 15;

  const total = Math.min(1200,
    breakdown.age + breakdown.education + breakdown.language +
    breakdown.canadaWork + breakdown.spouse + breakdown.transferability + breakdown.additional
  );
  return { total, breakdown };
}

function getTips(p: Profile, score: number, cutoff: number): string[] {
  const tips: string[] = [];
  const gap = cutoff - score;
  const avgCLB = (toClb(p.first_lang_reading, p.lang_test) + toClb(p.first_lang_writing, p.lang_test) +
    toClb(p.first_lang_listening, p.lang_test) + toClb(p.first_lang_speaking, p.lang_test)) / 4;

  if (!p.has_provincial_nomination)
    tips.push("🏆 Provincial Nomination (PNP) adds 600 pts instantly — explore OINP, BC PNP, AINP");
  if (!p.has_job_offer)
    tips.push("💼 A qualifying job offer (NOC TEER 0/1/2/3) adds 50–200 points");
  if (p.canada_work_years < 1)
    tips.push("🇨🇦 At least 1 year of Canadian work experience adds 40 points");
  if (p.canada_work_years >= 1 && p.canada_work_years < 3)
    tips.push("🇨🇦 Increasing Canadian work experience to 3+ years adds up to 80 points");
  if (avgCLB < 9)
    tips.push("🗣 Improving language to CLB 9 in all skills significantly boosts both core and transferability points");
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
  { value: "bachelors", label: "Bachelor's Degree (3–4 years)" },
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      const { data: existing } = await supabase.from("user_profiles").select("*").eq("id", u.id).single();
      if (existing) setProfile({ ...DEFAULT_PROFILE, ...existing });
      setLoadingProfile(false);
    });
    supabase.from("pr_draws").select("crs_score").is("province", null)
      .order("draw_date", { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]?.crs_score) setLatestCutoff(data[0].crs_score); });
  }, [router]);

  const { total: crsScore, breakdown } = useMemo(() => calcCRS(profile), [profile]);
  const gap = latestCutoff - crsScore;
  const isEligible = crsScore >= latestCutoff;
  const tips = useMemo(() => getTips(profile, crsScore, latestCutoff), [profile, crsScore, latestCutoff]);
  const hasSpouse = profile.marital_status === "married";
  const langOptions = profile.lang_test === "ielts" ? IELTS_OPTIONS : CELPIP_OPTIONS;

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
      <div className="canada-bg min-h-screen text-white flex items-center justify-center">
        <p className="text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  const scoreColor = isEligible ? "#22c55e" : gap <= 50 ? "#eab308" : "#d52b1e";

  return (
    <div className="canada-bg min-h-screen text-white">
      <Header activeNav="processing" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
                <select value={profile.education} onChange={e => update("education", e.target.value)} className="canada-input py-2 text-sm">
                  {EDU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Language */}
            <div className="canada-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">🗣 Language Skills</h2>
                {/* Test type toggle */}
                <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                  {(["ielts", "celpip"] as const).map(t => (
                    <button key={t} onClick={() => update("lang_test", t)}
                      style={{
                        padding: "5px 14px", fontWeight: 600, border: "none", cursor: "pointer",
                        background: profile.lang_test === t ? "linear-gradient(135deg,#d52b1e,#a01208)" : "transparent",
                        color: profile.lang_test === t ? "white" : "#9ca3af",
                      }}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {profile.lang_test === "ielts"
                  ? "Enter your IELTS General Training scores (0–9 scale, 0.5 steps)"
                  : "Enter your CELPIP-General scores (1–12 scale)"}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(["first_lang_reading","first_lang_writing","first_lang_listening","first_lang_speaking"] as const).map(key => {
                  const skill = key.replace("first_lang_","");
                  const clb = toClb(profile[key], profile.lang_test);
                  return (
                    <div key={key}>
                      <label className="text-xs text-gray-400 mb-1 block capitalize">
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        <span className="text-gray-600 ml-2">→ CLB {clb}</span>
                      </label>
                      <select value={profile[key]} onChange={e => update(key, Number(e.target.value))}
                        className="canada-input py-2 text-sm">
                        {langOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spouse Section — only if married */}
            {hasSpouse && (
              <div className="canada-card p-6 space-y-4" style={{ borderColor: "rgba(59,130,246,0.25)" }}>
                <div>
                  <h2 className="font-semibold text-base">💑 Spouse / Partner Details</h2>
                  <p className="text-xs text-gray-500 mt-1">Spouse factors add up to 40 points to your CRS score</p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Spouse Education</label>
                  <select value={profile.spouse_education} onChange={e => update("spouse_education", e.target.value)} className="canada-input py-2 text-sm">
                    {EDU_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Spouse Language Scores ({profile.lang_test.toUpperCase()})</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["spouse_lang_reading","spouse_lang_writing","spouse_lang_listening","spouse_lang_speaking"] as const).map(key => {
                      const skill = key.replace("spouse_lang_","");
                      const clb = toClb(profile[key], profile.lang_test);
                      return (
                        <div key={key}>
                          <label className="text-xs text-gray-500 mb-1 block capitalize">
                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                            <span className="text-gray-600 ml-1">CLB {clb}</span>
                          </label>
                          <select value={profile[key]} onChange={e => update(key, Number(e.target.value))}
                            className="canada-input py-2 text-sm">
                            {langOptions.map(v => <option key={v} value={v}>{v}</option>)}
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
            <div className="canada-card p-6 space-y-3">
              <h2 className="font-semibold text-base">⭐ Additional Factors</h2>
              {([
                { key: "has_canadian_education", label: "2+ year Canadian post-secondary degree/diploma", points: "+15" },
                { key: "has_provincial_nomination", label: "Provincial Nomination (PNP)", points: "+600" },
                { key: "has_job_offer", label: "Qualifying Canadian job offer (TEER 0/1/2/3)", points: "+50" },
                { key: "has_canadian_sibling", label: "Sibling who is a Canadian citizen or PR", points: "+15" },
              ] as const).map(({ key, label, points }) => (
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
                <div className="flex justify-between">
                  <span className="text-gray-400">Latest cut-off</span>
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
              <a href="/" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5">
                <span>⏱ Check processing times</span><span>→</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
