"use client";

// Replaces the flat 11-tool grid with a grouped Track / Calculate / Plan layout.
// The grouping comes from lib/tools.ts so it stays consistent with the mobile menu.

import { TOOLS, MOBILE_GROUPS } from "@/lib/tools";

const GROUP_BLURB: Record<string, string> = {
  Track: "Watch IRCC's system in real time",
  Calculate: "Score yourself against the requirements",
  Plan: "Choose your stream and gather what you need",
};

export default function ToolsByGroup() {
  return (
    <section>
      <h2 className="text-center text-lg sm:text-xl font-semibold text-white mb-1">
        All free immigration tools
      </h2>
      <p className="text-center text-sm text-gray-400 mb-6">
        Built by an immigrant — pulled directly from canada.ca, never paywalled
      </p>

      <div className="space-y-7">
        {MOBILE_GROUPS.map((section) => (
          <div key={section.title}>
            <div className="mb-3 px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {GROUP_BLURB[section.title]}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {section.keys.map((key) => {
                const tool = TOOLS[key];
                return (
                  <a
                    key={tool.href}
                    href={tool.href}
                    className="canada-feature-card transition-colors"
                    style={{
                      textDecoration: "none",
                      borderLeft: `3px solid ${tool.color}66`,
                    }}
                  >
                    <div className="text-xl mb-2">{tool.icon}</div>
                    <h4 className="text-sm font-bold text-white">{tool.label}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {tool.short}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
