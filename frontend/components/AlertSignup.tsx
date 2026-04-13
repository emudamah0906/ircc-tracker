"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type VisaType = { key: string; label: string };
type Country = { code: string; name: string };

export default function AlertSignup({
  visaTypes,
  countries,
}: {
  visaTypes: VisaType[];
  countries: Country[];
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visaType, setVisaType] = useState(visaTypes[0]?.key || "");
  const [countryCode, setCountryCode] = useState("IND");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !visaType || !countryCode) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { error: dbError } = await supabase
      .from("alert_subscriptions")
      .insert({
        email,
        phone: phone || null,
        visa_type: visaType,
        country_code: countryCode,
      });

    setLoading(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-1">Get Alerted When Times Change</h2>
      <p className="text-sm text-gray-400 mb-4">
        We&apos;ll notify you by email or SMS when processing times change for your visa type.
      </p>

      {submitted ? (
        <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
          You&apos;re on the list! We&apos;ll notify you at <strong>{email}</strong>
          {phone && <> and <strong>{phone}</strong></>} when times change.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1 - Email + Phone */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="your@email.com *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <input
              type="tel"
              placeholder="+1 416 000 0000 (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Row 2 - Visa + Country + Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {visaTypes.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {countries.slice(0, 50).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? "Saving..." : "Notify Me"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </section>
  );
}
