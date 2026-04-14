"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <PageLayout activeNav="pricing">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple Pricing</h1>
          <p className="text-gray-400 text-lg">Get instant alerts when processing times change</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free Plan */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-1">Free</h2>
            <p className="text-gray-400 text-sm mb-6">For casual users</p>
            <div className="text-4xl font-bold mb-6">$0</div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> View all processing times
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Historical trend charts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Search by country
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Daily digest email
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Instant change alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> SMS notifications
              </li>
            </ul>
            <a
              href="/"
              className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Get Started Free
            </a>
          </div>

          {/* Premium Plan */}
          <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </span>
            <h2 className="text-xl font-bold mb-1">Premium</h2>
            <p className="text-gray-400 text-sm mb-6">For active applicants</p>
            <div className="text-4xl font-bold mb-1">
              $4.99
              <span className="text-base font-normal text-gray-400">/month</span>
            </div>
            <p className="text-gray-500 text-xs mb-6">Cancel anytime</p>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> <strong>Instant email alerts</strong> on change
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Track multiple visa types
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Track multiple countries
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Priority support
              </li>
            </ul>

            <form onSubmit={handleUpgrade} className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Redirecting..." : "Get Premium — $4.99/mo"}
              </button>
            </form>

            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Payments secured by Stripe. Cancel anytime from your email.
        </p>
      </div>
    </PageLayout>
  );
}
