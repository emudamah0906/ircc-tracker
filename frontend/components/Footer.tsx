"use client";

const TOOL_LINKS = [
  { href: "/", label: "Processing Times" },
  { href: "/draws", label: "PR Draws" },
  { href: "/crs", label: "CRS Calculator" },
  { href: "/clb", label: "CLB Converter" },
  { href: "/pathway", label: "Pathway Finder" },
  { href: "/pnp", label: "PNP Tracker" },
  { href: "/noc", label: "NOC Finder" },
  { href: "/checklist", label: "Document Checklist" },
  { href: "/tracker", label: "Permit Tracker" },
  { href: "/funds", label: "Proof of Funds" },
];

const SOCIAL = {
  brandInstagram: "https://www.instagram.com/ircc_tracker",
  // brandFacebook: "https://www.facebook.com/...",  // Add when ready
  founderName: "Mahesh",
};

const PAGE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/news", label: "IRCC News" },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/5 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Top: brand + tool grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍁</span>
              <span className="text-base font-bold text-white">IRCC Tracker</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Free Canada immigration tools. Express Entry draws, CRS calculator, PNP tracker,
              and processing times — updated automatically from official IRCC sources.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={SOCIAL.brandInstagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="IRCC Tracker on Instagram"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
              >
                <InstagramIcon />
                <span className="text-xs font-medium">@ircc_tracker</span>
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Free tools
            </h3>
            <ul className="grid grid-cols-2 gap-y-1.5 gap-x-2">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages + founder */}
          <div>
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              About
            </h3>
            <ul className="space-y-1.5">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Built by {SOCIAL.founderName} — an immigrant helping the next wave 🍁
            </p>
          </div>
        </div>

        {/* Divider + legal */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            Data sourced from official IRCC (canada.ca) JSON feeds. Updated every 6 hours.
          </p>
          <p className="text-xs text-gray-600 text-center">
            ircctracker.org · Not affiliated with IRCC or the Government of Canada.
          </p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
