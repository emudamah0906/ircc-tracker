"use client";

import { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import DataFreshness from "@/components/DataFreshness";
import { FSW_FUNDS, STUDY_LIVING, FX_RATES } from "@/lib/ircc-data";

const FSW_AMOUNTS = FSW_FUNDS.data.amounts;
const FSW_EXTRA = FSW_FUNDS.data.extra;
const STUDY_LIVING_PER_YEAR = STUDY_LIVING.data.singlePerYear;
const STUDY_PER_DEPENDANT = STUDY_LIVING.data.perAdditional;
const CURRENCIES = FX_RATES.data;

type VisaType = "fsw" | "study" | "visitor";

function formatMoney(amount: number, currency: string): string {
  const rate = CURRENCIES[currency]?.rate ?? 1;
  const converted = amount * rate;
  if (converted >= 100000) return `${currency} ${(converted / 100000).toFixed(1)}L`;
  if (converted >= 1000) return `${currency} ${Math.round(converted / 100) / 10}K`;
  return `${currency} ${Math.round(converted).toLocaleString()}`;
}

export default function FundsPage() {
  const [visaType, setVisaType] = useState<VisaType>("fsw");
  const [familySize, setFamilySize] = useState(1);
  const [tuition, setTuition] = useState(15000);
  const [programYears, setProgramYears] = useState(2);
  const [studyDependants, setStudyDependants] = useState(0);
  const [currency, setCurrency] = useState("CAD");

  const required = useMemo(() => {
    if (visaType === "fsw") {
      if (familySize <= 7) return FSW_AMOUNTS[familySize];
      return FSW_AMOUNTS[7] + (familySize - 7) * FSW_EXTRA;
    }
    if (visaType === "study") {
      return tuition * programYears
        + STUDY_LIVING_PER_YEAR * programYears
        + studyDependants * STUDY_PER_DEPENDANT * programYears;
    }
    return 10000;
  }, [visaType, familySize, tuition, programYears, studyDependants]);

  const curr = CURRENCIES[currency];
  const dataset =
    visaType === "fsw" ? FSW_FUNDS
    : visaType === "study" ? STUDY_LIVING
    : null;

  const ACCEPTED_DOCS = [
    { icon: "🏦", title: "Bank statements", desc: "Last 6 months showing consistent balance — readily available, not borrowed" },
    { icon: "📄", title: "GIC (Study only)", desc: "Guaranteed Investment Certificate from a participating Canadian bank — required for the SDS stream" },
    { icon: "💰", title: "Letter of employment + pay stubs", desc: "Proof of regular income to sustain funds" },
    { icon: "📊", title: "Investment / mutual fund statements", desc: "Stocks, bonds, fixed deposits — must show holder's name & balance" },
    { icon: "🏠", title: "Property valuation (rare)", desc: "Real estate is generally NOT accepted by IRCC for proof of funds" },
  ];

  return (
    <PageLayout activeNav="funds">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">💰 Proof of Funds Calculator</h1>
          <p className="text-gray-400 text-sm mt-1">
            How much money you need to show IRCC for your application
          </p>
        </div>

        {/* Visa type */}
        <div className="canada-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Application Type</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: "fsw", icon: "🌍", label: "Express Entry / FSW" },
              { key: "study", icon: "🎓", label: "Study Permit" },
              { key: "visitor", icon: "✈️", label: "Visitor Visa" },
            ] as { key: VisaType; icon: string; label: string }[]).map(opt => (
              <button key={opt.key} onClick={() => setVisaType(opt.key)}
                className={`p-4 rounded-xl border text-center transition-all ${visaType === opt.key ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-xs font-semibold">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="canada-card p-5 space-y-4">
          {visaType === "fsw" && (
            <div>
              <label className="text-sm font-semibold block mb-1">How many people are coming with you?</label>
              <p className="text-xs text-gray-400 mb-3">Include yourself, spouse, and dependent children — even if they're not immigrating.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setFamilySize(s => Math.max(1, s - 1))}
                  className="w-10 h-10 rounded-full border border-white/20 text-xl font-bold hover:bg-white/10 transition-colors">−</button>
                <div className="text-center min-w-[80px]">
                  <div className="text-3xl font-bold">{familySize}</div>
                  <div className="text-xs text-gray-400">{familySize === 1 ? "person" : "people"}</div>
                </div>
                <button onClick={() => setFamilySize(s => Math.min(10, s + 1))}
                  className="w-10 h-10 rounded-full border border-white/20 text-xl font-bold hover:bg-white/10 transition-colors">+</button>
              </div>
              {familySize > 1 && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {Array.from({ length: familySize }, (_, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-400">
                      <span>{i === 0 ? "👤" : i === 1 ? "👫" : "👶"}</span>
                      <span>{i === 0 ? "You (principal)" : i === 1 ? "Spouse / partner" : `Child ${i - 1}`}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-3">
                Required for FSW and FST. <strong className="text-gray-300">CEC applicants do not need to show proof of funds.</strong> Funds must be available, accessible, and not borrowed.
              </p>
            </div>
          )}

          {visaType === "study" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Annual tuition (CAD)</label>
                <p className="text-xs text-gray-400 mb-2">Check your acceptance letter / DLI for the exact amount</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">CAD $</span>
                  <input type="number" value={tuition} min={0} step={500}
                    onChange={e => setTuition(Number(e.target.value))}
                    className="canada-input py-2 text-sm flex-1" />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[8000, 12000, 15000, 20000, 25000, 35000].map(v => (
                    <button key={v} onClick={() => setTuition(v)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${tuition === v ? "border-red-500 bg-red-900/20 text-white" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                      ${(v / 1000).toFixed(0)}K
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Program length (years)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(y => (
                    <button key={y} onClick={() => setProgramYears(y)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${programYears === y ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                      {y}yr
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Family members joining you</label>
                <p className="text-xs text-gray-400 mb-2">Spouse and children traveling with you (excluding yourself)</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setStudyDependants(n)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${studyDependants === n ? "border-red-500 bg-red-900/20" : "border-white/10 hover:border-white/20"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {visaType === "visitor" && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-xs text-yellow-300">
              <p className="font-semibold mb-1">⚠️ No fixed requirement for visitor visas</p>
              <p className="text-yellow-400/80 leading-relaxed">
                IRCC doesn&apos;t publish a specific amount for tourist visas. Officers look at trip length, ties to home country, and overall financial situation. CAD $10,000 is a common rule-of-thumb per person. Show what genuinely covers your stay.
              </p>
            </div>
          )}
        </div>

        {/* Currency selector */}
        <div className="canada-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Show amount in</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <button key={code} onClick={() => setCurrency(code)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${currency === code ? "border-red-500 bg-red-900/20 text-white" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                {c.flag} {code}
              </button>
            ))}
          </div>
          {currency !== "CAD" && (
            <p className="text-xs text-gray-600 mt-2">Reference rates only. Use live FX at application time and submit certified statements.</p>
          )}
        </div>

        {/* Result */}
        <div className="rounded-xl border p-6 text-center"
          style={{ background: "linear-gradient(135deg, rgba(213,43,30,0.1) 0%, rgba(255,255,255,0.03) 100%)", borderColor: "rgba(213,43,30,0.3)" }}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {visaType === "fsw" ? `Required for ${familySize} person${familySize > 1 ? "s" : ""}` : "Estimated amount needed"}
          </p>

          {currency === "CAD" ? (
            <div className="text-5xl font-bold text-white mb-1">
              ${required.toLocaleString()}
              <span className="text-xl font-normal text-gray-400 ml-2">CAD</span>
            </div>
          ) : (
            <>
              <div className="text-5xl font-bold text-white mb-1">
                {formatMoney(required, currency)}
              </div>
              <div className="text-sm text-gray-400">
                = CAD ${required.toLocaleString()} ({curr.flag} 1 CAD ≈ {curr.rate} {currency})
              </div>
            </>
          )}

          {visaType === "fsw" && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {Object.entries(FSW_AMOUNTS).slice(0, 6).map(([size, amount]) => (
                <div key={size} className={`p-2 rounded-lg ${Number(size) === familySize ? "bg-red-900/30 border border-red-700/40" : "bg-white/5"}`}>
                  <div className="text-gray-400">{size} {Number(size) === 1 ? "person" : "people"}</div>
                  <div className="font-semibold text-white">${(amount / 1000).toFixed(1)}K</div>
                </div>
              ))}
            </div>
          )}

          {visaType === "study" && (
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between border-t border-white/10 pt-3">
                <span>Tuition ({programYears}yr × ${tuition.toLocaleString()})</span>
                <span className="text-white">${(tuition * programYears).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Living expenses ({programYears}yr × ${STUDY_LIVING_PER_YEAR.toLocaleString()})</span>
                <span className="text-white">${(STUDY_LIVING_PER_YEAR * programYears).toLocaleString()}</span>
              </div>
              {studyDependants > 0 && (
                <div className="flex justify-between">
                  <span>Family ({studyDependants} × ${STUDY_PER_DEPENDANT.toLocaleString()}/yr × {programYears}yr)</span>
                  <span className="text-white">${(studyDependants * STUDY_PER_DEPENDANT * programYears).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-white/10 pt-1 text-white">
                <span>Total</span>
                <span>${required.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Accepted documents */}
        <div className="canada-card p-5">
          <h3 className="font-semibold text-sm mb-3">📄 What Documents Are Accepted as Proof of Funds?</h3>
          <div className="space-y-3">
            {ACCEPTED_DOCS.map((doc, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-lg">{doc.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doc.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {visaType === "study" && (
            <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2.5 text-xs text-blue-300">
              <strong>GIC (Guaranteed Investment Certificate)</strong> — under the Student Direct Stream (SDS) some Canadian banks require a GIC equal to your first year of living costs. This counts toward the totals above.
            </div>
          )}
        </div>

        {/* Source / freshness */}
        {dataset && (
          <DataFreshness
            lastVerified={dataset.lastVerified}
            source={dataset.source}
            sourceLabel={dataset.sourceLabel}
            cadence={dataset.cadence}
            note={dataset.note}
          />
        )}

        {/* Next steps */}
        <div className="canada-card p-5 space-y-2">
          <h3 className="font-semibold text-sm mb-3">🔗 Next Steps</h3>
          <a href="/pathway" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5 border-b border-white/5">
            <span>🗺️ Find your best PR pathway</span><span>→</span>
          </a>
          <a href="/tracker" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5 border-b border-white/5">
            <span>⏰ Track your permit expiry</span><span>→</span>
          </a>
          <a href="/crs" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5 border-b border-white/5">
            <span>🧮 Calculate your CRS score</span><span>→</span>
          </a>
          <a href="/" className="flex items-center justify-between text-xs text-gray-400 hover:text-white py-1.5">
            <span>⏱ Check processing times</span><span>→</span>
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
