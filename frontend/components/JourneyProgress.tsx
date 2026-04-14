"use client";

import { useEffect, useState } from "react";
import {
  getJourneyType,
  getCompletedTools,
  markToolCompleted,
  JOURNEY_STEPS,
  type JourneyType,
} from "@/lib/journey";

export default function JourneyProgress({ currentSlug }: { currentSlug: string }) {
  const [journeyType, setJourneyType] = useState<JourneyType | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const type = getJourneyType();
    setJourneyType(type);
    if (type) {
      markToolCompleted(currentSlug);
      setCompleted(getCompletedTools());
    }
  }, [currentSlug]);

  if (!journeyType) return null;

  const steps = JOURNEY_STEPS[journeyType];
  const currentIndex = steps.findIndex((s) => s.slug === currentSlug);

  return (
    <div className="canada-card px-4 py-3 mb-6">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        {steps.map((step, i) => {
          const isCurrent = step.slug === currentSlug;
          const isDone = completed.includes(step.slug) && !isCurrent;
          const isFuture = !isDone && !isCurrent;

          return (
            <a
              key={step.slug}
              href={step.href}
              className="flex items-center gap-2 flex-shrink-0"
              style={{ textDecoration: "none" }}
            >
              {/* Step indicator */}
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: isCurrent
                    ? "linear-gradient(135deg, #d52b1e, #a01208)"
                    : isDone
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(255,255,255,0.06)",
                  color: isCurrent ? "white" : isDone ? "#4ade80" : "#6b7280",
                  border: isCurrent
                    ? "none"
                    : isDone
                    ? "1px solid rgba(34,197,94,0.3)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {isDone ? "✓" : i + 1}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent ? "text-white" : isDone ? "text-green-400" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="w-6 h-px flex-shrink-0"
                  style={{
                    background: isDone
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
