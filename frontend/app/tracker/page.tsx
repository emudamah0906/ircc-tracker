"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { supabase } from "@/lib/supabase";

type PermitType = "work" | "study" | "visitor" | "pr_card";

const PERMIT_CONFIG: Record<PermitType, {
  label: string; icon: string; color: string;
  renewDaysBefore: number; processingWeeks: number;
  description: string; tip: string; irccLink: string;
}> = {
  work: {
    label: "Work Permit", icon: "💼", color: "#3b82f6",
    renewDaysBefore: 90, processingWeeks: 12,
    description: "You can apply to extend your work permit while in Canada",
    tip: "Apply at least 90 days before expiry. If you apply before it expires, you can continue working under 'maintained status'.",
    irccLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/extend.html",
  },
  study: {
    label: "Study Permit", icon: "🎓", color: "#8b5cf6",
    renewDaysBefore: 90, processingWeeks: 16,
    description: "Extend your study permit before starting a new program or to continue studying",
    tip: "Apply before your permit expires. As long as you applied before expiry, you can continue studying under maintained status.",
    irccLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/extend-study-permit.html",
  },
  visitor: {
    label: "Visitor Record / TRV", icon: "🌏", color: "#f59e0b",
    renewDaysBefore: 30, processingWeeks: 4,
    description: "Extend your stay in Canada as a visitor",
    tip: "Apply before your status expires. Most visitors are given status until their passport expires or 6 months, whichever is sooner.",
    irccLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/extend-stay.html",
  },
  pr_card: {
    label: "PR Card", icon: "🪪", color: "#10b981",
    renewDaysBefore: 180, processingWeeks: 60,
    description: "Renew your Permanent Resident card",
    tip: "PR card renewal takes up to 60 weeks. Apply well before it expires — you need a valid PR card to re-enter Canada by commercial transport.",
    irccLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/pr-card/apply-renew-replace.html",
  },
};

function getDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(days: number, renewBefore: number) {
  if (days < 0) return { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "🚨" };
  if (days === 0) return { label: "Expires Today!", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "🚨" };
  if (days <= 30) return { label: "Urgent — Apply Now", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "🔴" };
  if (days <= renewBefore) return { label: "Time to Apply", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "🟡" };
  if (days <= renewBefore + 30) return { label: "Apply Soon", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "🟡" };
  return { label: "You're Good", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: "🟢" };
}

export default function TrackerPage() {
  const [permitType, setPermitType] = useState<PermitType>("work");
  const [expiryDate, setExpiryDate] = useState("");
  const [email, setEmail] = useState("");
  const [reminderSaved, setReminderSaved] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [today] = useState(() => new Date().toISOString().split("T")[0]);

  const config = PERMIT_CONFIG[permitType];
  const daysUntil = expiryDate ? getDaysUntil(expiryDate) : null;
  const status = daysUntil !== null ? getStatus(daysUntil, config.renewDaysBefore) : null;

  // Apply-by date = expiry minus renewDaysBefore
  const applyByDate = expiryDate
    ? new Date(new Date(expiryDate).getTime() - config.renewDaysBefore * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : null;
  const daysUntilApplyBy = applyByDate ? getDaysUntil(applyByDate) : null;

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !expiryDate) return;
    setSavingReminder(true);
    await supabase.from("permit_reminders").insert({
      email,
      permit_type: permitType,
      expiry_date: expiryDate,
      remind_date: applyByDate,
    });
    setSavingReminder(false);
    setReminderSaved(true);
  }

  return (
    <PageLayout activeNav="tracker">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">⏰ Permit Expiry Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">
            Know exactly when to renew — never let your status lapse in Canada
          </p>
        </div>

        {/* Permit type selector */}
        <div className="canada-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Select Your Permit Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(PERMIT_CONFIG) as [PermitType, typeof PERMIT_CONFIG[PermitType]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setPermitType(key)}
                className={`p-3 rounded-xl border text-center transition-all ${permitType === key ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                <div className="text-xl mb-1">{cfg.icon}</div>
                <div className="text-xs font-semibold">{cfg.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date input */}
        <div className="canada-card p-5">
          <label className="text-sm font-semibold block mb-1">
            {config.icon} When does your {config.label} expire?
          </label>
          <p className="text-xs text-gray-400 mb-3">Check the expiry date on your permit/card</p>
          <input
            type="date"
            value={expiryDate}
            min={today}
            onChange={e => setExpiryDate(e.target.value)}
            className="canada-input py-2.5 text-sm"
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Results */}
        {expiryDate && daysUntil !== null && status && (
          <>
            {/* Status card */}
            <div className="rounded-xl border p-6 text-center"
              style={{ background: status.bg, borderColor: status.border }}>
              <div className="text-4xl mb-3">{status.icon}</div>
              <div className="text-5xl font-bold mb-1" style={{ color: status.color }}>
                {daysUntil < 0 ? Math.abs(daysUntil) : daysUntil}
              </div>
              <div className="text-sm text-gray-300 mb-2">
                {daysUntil < 0 ? "days since expiry" : daysUntil === 0 ? "expires today" : "days until expiry"}
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: `${status.color}20`, color: status.color, border: `1px solid ${status.color}40` }}>
                {status.label}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {config.label} expires: <strong className="text-white">{new Date(expiryDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}</strong>
              </div>
            </div>

            {/* Timeline */}
            <div className="canada-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">📅 Your Renewal Timeline</h3>

              <div className="space-y-3">
                {[
                  {
                    date: applyByDate!,
                    label: "Apply by this date",
                    sub: `${config.renewDaysBefore} days before expiry — start your renewal application`,
                    color: daysUntilApplyBy !== null && daysUntilApplyBy <= 0 ? "#ef4444" : "#f59e0b",
                    done: daysUntilApplyBy !== null && daysUntilApplyBy <= 0,
                  },
                  {
                    date: expiryDate,
                    label: "Current permit expires",
                    sub: "After this date you are out of status (unless you applied before — 'maintained status')",
                    color: "#ef4444",
                    done: daysUntil <= 0,
                  },
                  {
                    date: new Date(new Date(expiryDate).getTime() + config.processingWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    label: "Expected decision (~)",
                    sub: `Estimated ${config.processingWeeks} weeks processing time`,
                    color: "#22c55e",
                    done: false,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.done ? "#6b7280" : item.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium" style={{ color: item.done ? "#6b7280" : "white" }}>{item.label}</span>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="canada-card p-5" style={{ borderColor: `${config.color}30` }}>
              <h3 className="font-semibold text-sm mb-2">💡 Important: {config.label}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">{config.tip}</p>
            </div>

            {/* Email reminder */}
            <div className="canada-card p-5">
              <h3 className="font-semibold text-sm mb-1">🔔 Get a Reminder Email</h3>
              <p className="text-xs text-gray-400 mb-4">
                We&apos;ll email you on <strong className="text-white">
                  {applyByDate ? new Date(applyByDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                </strong> — the day you should apply for renewal
              </p>
              {reminderSaved ? (
                <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
                  ✓ Reminder set! We&apos;ll email you at <strong>{email}</strong> when it&apos;s time to renew.
                </div>
              ) : (
                <form onSubmit={saveReminder} className="flex gap-2">
                  <input type="email" placeholder="your@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="canada-input py-2 text-sm flex-1" />
                  <button type="submit" disabled={savingReminder} className="canada-btn whitespace-nowrap" style={{ opacity: savingReminder ? 0.7 : 1 }}>
                    {savingReminder ? "Saving..." : "Remind Me"}
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {/* No date yet — show info cards */}
        {!expiryDate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.entries(PERMIT_CONFIG) as [PermitType, typeof PERMIT_CONFIG[PermitType]][]).map(([key, cfg]) => (
              <div key={key} className="canada-card p-4" style={{ borderColor: `${cfg.color}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{cfg.icon}</span>
                  <span className="font-semibold text-sm">{cfg.label}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Renew: <span className="text-white">{cfg.renewDaysBefore} days before expiry</span></div>
                  <div>Processing: <span className="text-white">~{cfg.processingWeeks} weeks</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cross-tool suggestions */}
        {expiryDate && (
          <div className="space-y-3">
            <a href="/" className="canada-next-step" style={{ textDecoration: "none" }}>
              <span className="text-xl">⏱</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Check current processing times</p>
                <p className="text-xs text-gray-400">See how long your renewal application will take</p>
              </div>
              <span className="text-gray-400 text-xs">→</span>
            </a>
            <a href="/pathway" className="canada-next-step" style={{ textDecoration: "none" }}>
              <span className="text-xl">🗺️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Planning for PR?</p>
                <p className="text-xs text-gray-400">Find the best permanent residency pathway for you</p>
              </div>
              <span className="text-gray-400 text-xs">→</span>
            </a>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
