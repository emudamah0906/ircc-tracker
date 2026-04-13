"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import type { User } from "@supabase/supabase-js";

type Profile = {
  age: number;
  marital_status: "single" | "married";
  education: string;
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
};

const DEFAULT_PROFILE: Profile = {
  age: 28,
  marital_status: "single",
  education: "bachelors",
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
};

// ── CRS Calculation ────────────────────────────────────────────────────────────
function ieltsToClb(score: number): number {
  if (score >= 8.5) return 10;
  if (score >= 8.0) return 9;
  if (score >= 7.5) return 8;  // Listening/Reading
  if (score >= 7.0) return 8;  // Speaking/Writing -> CLB 8
  if (score >= 6.5) return 7;
  if (score >= 6.0) return 6;  // Simplified
  if (score >= 5.5) return 5;
  return 4;
}

function clbToPoints(clb: number, isFirstLang: boolean): number {
  // Per skill, without spouse
  if (!isFirstLang) {
    // Second language: max 22 per skill at CLB 9+
    const map: Record<number, number> = { 10: 6, 9: 6, 8: 3, 7: 3, 6: 1, 5: 1 };
    return map[Math.min(clb, 10)] ?? 0;
  }
  // First language per skill (listening/reading/writing/speaking)
  const map: Record<number, number> = { 10: 34, 9: 31, 8: 23, 7: 17, 6: 9, 5: 1 };
  return map[Math.min(clb, 10)] ?? 0;
}

function calcCRS(p: Profile): number {
  const hasSpouse = p.marital_status === "married";
  let score = 0;

  // ── A: Core / Human Capital ──────────────────────────────────────────────
  // Age
  const agePoints: Record<number, [number, number]> = {
    17: [0, 0], 18: [99, 90], 19: [105, 95], 20: [110, 100],
    21: [110, 100], 22: [110, 100], 23: [110, 100], 24: [110, 100],
    25: [110, 100], 26: [110, 100], 27: [110, 100], 28: [110, 100],
    29: [110, 100], 30: [105, 95], 31: [99, 90], 32: [94, 85],
    33: [88, 80], 34: [83, 75], 35: [77, 70], 36: [72, 65],
    37: [66, 60], 38: [61, 55], 39: [55, 50], 40: [50, 45],
    41: [39, 35], 42: [28, 25], 43: [17, 15], 44: [6, 5],
  };
  const ageKey = Math.min(44, Math.max(17, p.age));
  score += hasSpouse ? (agePoints[ageKey]?.[1] ?? 0) : (agePoints[ageKey]?.[0] ?? 0);

  // Education
  const eduMap: Record<string, [number, number]> = {
    less_than_secondary: [0, 0],
    secondary: [30, 28],
    one_year_diploma: [90, 84],
    two_year_diploma: [98, 91],
    bachelors: [120, 112],
    two_or_more_certs: [128, 119],
    masters: [135, 126],
    doctoral: [150, 140],
  };
  score += hasSpouse ? (eduMap[p.education]?.[1] ?? 120) : (eduMap[p.education]?.[0] ?? 120);

  // Language — first official language
  const r = ieltsToClb(p.first_lang_reading);
  const w = ieltsToClb(p.first_lang_writing);
  const l = ieltsToClb(p.first_lang_listening);
  const s = ieltsToClb(p.first_lang_speaking);
  score += clbToPoints(r, true) + clbToPoints(w, true) + clbToPoints(l, true) + clbToPoints(s, true);

  // Canadian work experience
  const canWorkMap: Record<number, [number, number]> = {
    0: [0, 0], 1: [40, 35], 2: [53, 46], 3: [64, 56], 4: [72, 63], 5: [80, 70],
  };
  const canKey = Math.min(5, p.canada_work_years);
  score += hasSpouse ? (canWorkMap[canKey]?.[1] ?? 0) : (canWorkMap[canKey]?.[0] ?? 0);

  // ── B: Spouse factors ────────────────────────────────────────────────────
  // (simplified — spouse same CLB as primary for now)
  // Omitted for brevity; shown as 0 unless user fills spouse details

  // ── C: Skill Transferability (max 100) ────────────────────────────────
  let transferability = 0;
  const avgCLB = (r + w + l + s) / 4;
  const eduLevel = ["bachelors", "two_or_more_certs", "masters", "doctoral"].includes(p.education);

  // Education + language
  if (eduLevel && avgCLB >= 9) transferability += 50;
  else if (eduLevel && avgCLB >= 7) transferability += 25;

  // Education + Canadian work exp
  if (eduLevel && p.canada_work_years >= 1) transferability += 25;
  else if (eduLevel && p.canada_work_years >= 1) transferability += 13;

  // Foreign work + Canadian work
  if (p.foreign_work_years >= 3 && p.canada_work_years >= 1) transferability += 25;
  else if (p.foreign_work_years >= 1 && p.canada_work_years >= 1) transferability += 13;

  // Foreign work + language
  if (p.foreign_work_years >= 3 && avgCLB >= 9) transferability += 50;
  else if (p.foreign_work_years >= 1 && avgCLB >= 7) transferability += 25;

  score += Math.min(100, transferability);

  // ── D: Additional Points ─────────────────────────────────────────────────
  if (p.has_provincial_nomination) score += 600;
  if (p.has_job_offer) score += 50; // NOC 0/A/B
  if (p.has_canadian_sibling) score += 15;
  if (p.has_canadian_education) score += 15; // 2+ year post-sec

  return Math.min(1200, score);
}

function getTips(p: Profile, score: number, cutoff: number): string[] {
  const tips: string[] = [];
  const gap = cutoff - score;

  if (p.has_provincial_nomination === false)
    tips.push("🏆 Get a Provincial Nomination (PNP) — adds 600 points instantly, guarantees an ITA");
  if (!p.has_job_offer)
    tips.push("💼 A qualifying job offer (NOC 0/A/B) adds 50–200 points");
  if (p.canada_work_years < 1)
    tips.push("🇨🇦 Get at least 1 year of Canadian work experience — adds 40+ points");
  if (p.canada_work_years >= 1 && p.canada_work_years < 3)
    tips.push("🇨🇦 Increasing Canadian work experience to 3+ years adds up to 80 points");

  const avgCLB = (
    ieltsToClb(p.first_lang_reading) + ieltsToClb(p.first_lang_writing) +
    ieltsToClb(p.first_lang_listening) + ieltsToClb(p.first_lang_speaking)
  ) / 4;
  if (avgCLB < 9)
    tips.push("🗣 Improving your language score to CLB 9 across all skills adds significant points");
  if (!p.has_canadian_sibling)
    tips.push("👨‍👩‍👧 If you have a sibling who is a Canadian citizen/PR, that adds 15 points");
  if (gap > 0 && gap <= 50)
    tips.push(`📈 You're only ${gap} points below the latest cut-off — a small improvement could get you an ITA!`);

  return tips.slice(0, 4);
}

// ── Component ──────────────────────────────────────────────────────────────────
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

      // Load saved profile
      const { data: saved } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      if (saved) setProfile({ ...DEFAULT_PROFILE, ...saved });
      setLoadingProfile(false);
    });

    // Fetch latest CRS cutoff
    supabase.from("pr_draws").select("crs_score").is("province", null)
      .order("draw_date", { ascending: false }).limit(1)
      .then(({ data }) => { if (data?.[0]?.crs_score) setLatestCutoff(data[0].crs_score); });
  }, [router]);

  const crsScore = useMemo(() => calcCRS(profile), [profile]);
  const gap = latestCutoff - crsScore;
  const isEligible = crsScore >= latestCutoff;
  const tips = useMemo(() => getTips(profile, crsScore, latestCutoff), [profile, crsScore, latestCutoff]);

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

  return (
    <div className="canada-bg min-h-screen text-white">
      <Header activeNav="processing" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">My PR Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Fill in your profile — we&apos;ll calculate your CRS score and tell you where you stand for Canadian PR.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Profile Form ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-white text-base">👤 Personal Information</h2>

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
                <select value={profile.education}
                  onChange={e => update("education", e.target.value)}
                  className="canada-input py-2 text-sm">
                  <option value="less_than_secondary">Less than Secondary</option>
                  <option value="secondary">Secondary (High School)</option>
                  <option value="one_year_diploma">1-Year Diploma / Certificate</option>
                  <option value="two_year_diploma">2-Year Diploma / Certificate</option>
                  <option value="bachelors">Bachelor&apos;s Degree (3-4 years)</option>
                  <option value="two_or_more_certs">Two or More Certificates</option>
                  <option value="masters">Master&apos;s Degree</option>
                  <option value="doctoral">PhD / Doctoral</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-white text-base">🗣 Language Skills (IELTS Score)</h2>
              <p className="text-xs text-gray-500">Enter your IELTS General scores (or equivalent). Each skill is scored 0–9.</p>

              <div className="grid grid-cols-2 gap-4">
                {(["first_lang_reading", "first_lang_writing", "first_lang_listening", "first_lang_speaking"] as const).map(key => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 mb-1 block capitalize">
                      {key.replace("first_lang_", "").charAt(0).toUpperCase() + key.replace("first_lang_", "").slice(1)}
                    </label>
                    <select value={profile[key]}
                      onChange={e => update(key, Number(e.target.value))}
                      className="canada-input py-2 text-sm">
                      {[9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div className="canada-card p-6 space-y-4">
              <h2 className="font-semibold text-white text-base">💼 Work Experience</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Years of Canadian Work Exp.</label>
                  <select value={profile.canada_work_years}
                    onChange={e => update("canada_work_years", Number(e.target.value))}
                    className="canada-input py-2 text-sm">
                    {[0,1,2,3,4,5].map(v => (
                      <option key={v} value={v}>{v === 0 ? "None" : `${v} year${v > 1 ? "s" : ""}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Years of Foreign Work Exp.</label>
                  <select value={profile.foreign_work_years}
                    onChange={e => update("foreign_work_years", Number(e.target.value))}
                    className="canada-input py-2 text-sm">
                    {[0,1,2,3,4,5].map(v => (
                      <option key={v} value={v}>{v === 0 ? "None" : `${v} year${v > 1 ? "s" : ""}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Factors */}
            <div className="canada-card p-6 space-y-3">
              <h2 className="font-semibold text-white text-base">⭐ Additional Factors</h2>

              {([
                { key: "has_canadian_education", label: "I have a 2+ year Canadian post-secondary degree/diploma", points: "+15 pts" },
                { key: "has_provincial_nomination", label: "I have a Provincial Nomination (PNP)", points: "+600 pts" },
                { key: "has_job_offer", label: "I have a qualifying Canadian job offer (NOC 0/A/B)", points: "+50 pts" },
                { key: "has_canadian_sibling", label: "I have a brother/sister who is a Canadian citizen or PR", points: "+15 pts" },
              ] as const).map(({ key, label, points }) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={profile[key]}
                      onChange={e => update(key, e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  </div>
                  <span className="text-xs text-green-400 font-semibold whitespace-nowrap">{points}</span>
                </label>
              ))}
            </div>

            {/* Save button */}
            <button onClick={saveProfile} disabled={saving}
              className="canada-btn w-full"
              style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : saved ? "✓ Profile Saved" : "Save My Profile"}
            </button>
          </div>

          {/* ── RIGHT: Score + Eligibility ── */}
          <div className="space-y-5">

            {/* CRS Score Card */}
            <div className="canada-card p-6 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your CRS Score</p>
              <div className={`text-6xl font-bold mb-2 ${
                isEligible ? "text-green-400" : gap <= 50 ? "text-yellow-400" : "text-red-400"
              }`}>
                {crsScore}
              </div>
              <div className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4 ${
                isEligible ? "bg-green-900/40 text-green-400 border border-green-700"
                : gap <= 50 ? "bg-yellow-900/40 text-yellow-400 border border-yellow-700"
                : "bg-red-900/40 text-red-400 border border-red-700"
              }`}>
                {isEligible ? "✓ Above Cut-off" : gap <= 50 ? `⚠ ${gap} pts below cut-off` : `✕ ${gap} pts below cut-off`}
              </div>

              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>0</span><span>1200</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(crsScore / 1200) * 100}%`,
                    background: isEligible ? "#22c55e" : gap <= 50 ? "#eab308" : "#d52b1e"
                  }}
                />
              </div>

              <div className="border-t border-white/10 pt-4 mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Latest cut-off</span>
                  <span className="text-yellow-400 font-bold">{latestCutoff}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your score</span>
                  <span className="text-white font-bold">{crsScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEligible ? "Above cut-off by" : "Points needed"}</span>
                  <span className={`font-bold ${isEligible ? "text-green-400" : "text-red-400"}`}>
                    {Math.abs(gap)}
                  </span>
                </div>
              </div>
            </div>

            {/* Eligibility Status */}
            <div className={`canada-card p-5 ${isEligible ? "border-green-700/40" : "border-red-700/20"}`}>
              <h3 className="font-semibold text-sm mb-3">
                {isEligible ? "🎉 PR Eligible!" : "📋 PR Status"}
              </h3>
              {isEligible ? (
                <p className="text-xs text-green-300 leading-relaxed">
                  Your score is above the latest Express Entry cut-off. You may receive an Invitation to Apply (ITA) in the next draw. Make sure your profile is complete and up to date in your IRCC My Account.
                </p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your current score is <span className="text-white font-semibold">{gap} points</span> below the latest federal draw cut-off of <span className="text-yellow-400 font-semibold">{latestCutoff}</span>. See the tips below to improve your score.
                </p>
              )}
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="canada-card p-5">
                <h3 className="font-semibold text-sm mb-3">💡 How to Improve</h3>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed border-l-2 border-red-800 pl-3">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Links */}
            <div className="canada-card p-5 space-y-2">
              <h3 className="font-semibold text-sm mb-3">🔗 Useful Links</h3>
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
