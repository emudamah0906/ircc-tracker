"use client";

import { TOOLS, ALL_TOOLS } from "@/lib/tools";

export default function ToolShowcase() {
  return (
    <section>
      <h2 className="text-center text-lg font-semibold text-white mb-1">
        {ALL_TOOLS.length} Free Immigration Tools
      </h2>
      <p className="text-center text-xs text-gray-500 mb-5">
        No account required · No credit card · Built by an immigrant
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TOOLS.map((key) => {
          const tool = TOOLS[key];
          return (
            <a
              key={tool.href}
              href={tool.href}
              className="canada-feature-card"
            >
              <div className="text-2xl mb-3">{tool.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1">{tool.label}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{tool.long}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
