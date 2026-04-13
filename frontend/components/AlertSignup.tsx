"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFlagEmoji, DIAL_CODES } from "@/lib/countries";

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
  const [dialCode, setDialCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
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

    const fullPhone = phoneNumber ? `${dialCode}${phoneNumber}` : null;

    setLoading(true);

    const { error: dbError } = await supabase
      .from("alert_subscriptions")
      .insert({
        email,
        phone: fullPhone,
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
      <h2 className="text-lg font-semibold mb-1">
        Get Alerted When Times Change — Free
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Enter your email and/or mobile number. We&apos;ll notify you for free when processing times change for your visa type.
      </p>

      {submitted ? (
        <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">
          You&apos;re on the list! We&apos;ll notify you at{" "}
          <strong>{email}</strong>
          {phoneNumber && (
            <> and <strong>{dialCode}{phoneNumber}</strong></>
          )}{" "}
          when times change.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Row 1 — Email */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email Address *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Row 2 — Phone with dial code */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Mobile Number (optional)</label>
            <div className="flex gap-2">
              <select
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-red-500 w-36"
              >
                {DIAL_CODES.map((d) => (
                  <option key={`${d.code}-${d.dial}`} value={d.dial}>
                    {getFlagEmoji(d.code)} {d.dial} {d.name}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="416 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Row 3 — Visa + Country */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Visa Type *</label>
              <select
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {visaTypes.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Your Country *</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {countries.slice(0, 50).map((c) => (
                  <option key={c.code} value={c.code}>
                    {getFlagEmoji(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Notify Me for Free"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </section>
  );
}
