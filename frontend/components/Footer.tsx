"use client";

const TOOL_LINKS = [
  { href: "/", label: "Processing Times" },
  { href: "/draws", label: "PR Draws" },
  { href: "/crs", label: "CRS Calculator" },
  { href: "/pathway", label: "Pathway Finder" },
  { href: "/tracker", label: "Permit Tracker" },
  { href: "/funds", label: "Proof of Funds" },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/5 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tool links */}
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {TOOL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Trust signal */}
          <p className="text-xs text-gray-600 text-center">
            Data sourced from official IRCC website
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          ircctracker.org — Not affiliated with IRCC or the Government of Canada
        </p>
      </div>
    </footer>
  );
}
