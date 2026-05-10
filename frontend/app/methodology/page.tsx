import PageLayout from "@/components/PageLayout";
import Link from "next/link";

/**
 * /methodology — explains exactly where each piece of data on the site
 * comes from, how often it refreshes, what we DON'T do, and how to report
 * an error. Linked from the site-wide TrustBanner.
 *
 * The point of this page is to BE the trust signal — not to assert trust
 * with fabricated stats elsewhere. Every claim on this page must be
 * verifiable. If you change a data source, update this page in the same PR.
 */

export default function MethodologyPage() {
  return (
    <PageLayout subtitle="How IRCC Tracker works" activeNav="about">
      <article className="space-y-8 max-w-3xl">

        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            How IRCC Tracker works
          </h1>
          <p className="text-sm text-gray-400">
            What data we use, where it comes from, how often we refresh it,
            and what we do NOT do. Read this before trusting any number you
            see on the site.
          </p>
        </header>

        <section className="canada-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">📡 Data sources</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Every dataset on IRCC Tracker comes from a publicly-published
            file on canada.ca. We do not scrape paywalled sites, we do not
            buy data from third parties, and we do not invent estimates.
            If IRCC&apos;s file is wrong, ours is wrong too — and we update
            within hours of any IRCC publication.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              {
                tool: "Processing Times",
                src: "https://www.canada.ca/content/dam/ircc/documents/json/data-ptime-en.json",
                cadence: "Refreshed every 6 hours",
              },
              {
                tool: "Express Entry & PNP Draws",
                src: "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json",
                cadence: "Refreshed every 6 hours; new draws appear within ~6h of IRCC publishing",
              },
              {
                tool: "IRCC News",
                src: "https://www.canada.ca/en/immigration-refugees-citizenship/news.html (RSS)",
                cadence: "Refreshed every 6 hours",
              },
              {
                tool: "CRS Score Calculator",
                src: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html",
                cadence: "Verified by hand against the official IRCC grid; lastVerified date shown on the calculator footer",
              },
              {
                tool: "Proof of Funds",
                src: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
                cadence: "Verified annually (IRCC publishes a new table around June 1)",
              },
              {
                tool: "NOC Code Finder",
                src: "https://noc.esdc.gc.ca/ (NOC 2021)",
                cadence: "NOC 2021 is the current version; updated when ESDC publishes a new edition",
              },
              {
                tool: "Document Checklists",
                src: "Per-stream IRCC application guides (linked on each checklist)",
                cadence: "Verified per release; lastVerified shown on each checklist footer",
              },
            ].map((row) => (
              <li key={row.tool} className="border-l-2 border-red-700/40 pl-3">
                <p className="font-semibold text-white">{row.tool}</p>
                <p className="text-xs text-gray-500 break-all mt-0.5">
                  {row.src.startsWith("http") ? (
                    <a href={row.src} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline decoration-dotted">
                      {row.src}
                    </a>
                  ) : row.src}
                </p>
                <p className="text-xs text-gray-400 mt-1">{row.cadence}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="canada-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">⚙️ How &quot;Last IRCC sync&quot; is calculated</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            The freshness timestamp at the top of every page reads the
            <code className="font-mono text-xs px-1.5 py-0.5 mx-1 bg-white/5 rounded">scraper_health</code>
            row for our processing-times scraper — the only one that writes
            on every successful run. If that scraper hasn&apos;t reported
            success in 12+ hours, the banner turns amber and labels the
            timestamp <em>(stale)</em>. We surface scraper outages instead
            of hiding them.
          </p>
        </section>

        <section className="canada-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">🚫 What we do NOT do</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We are <strong>not</strong> a regulated immigration consultant. We do not give legal advice. For your specific case, consult a member of the <a href="https://college-ic.ca/protecting-the-public/find-an-immigration-consultant" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-dotted">College of Immigration and Citizenship Consultants (CICC)</a> or a Canadian immigration lawyer.</span></li>
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We are <strong>not affiliated with</strong> Immigration, Refugees and Citizenship Canada (IRCC), the College of Immigration and Citizenship Consultants, or the Government of Canada.</span></li>
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We do <strong>not</strong> file applications, submit profiles, or interact with IRCC accounts on your behalf.</span></li>
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We do <strong>not</strong> fabricate accuracy statistics. We do not display &quot;X% accurate&quot; or &quot;N verified outcomes&quot; numbers we cannot back up with measurement.</span></li>
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We do <strong>not</strong> sell, share, or rent your email address. The only thing we use it for is sending you the alert you signed up for.</span></li>
            <li className="flex gap-2"><span aria-hidden="true">•</span><span>We do <strong>not</strong> store any of your CRS calculator inputs server-side unless you explicitly create an account and save your profile.</span></li>
          </ul>
        </section>

        <section className="canada-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">🐛 Found a wrong number?</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            If a CRS point value, a draw cutoff, a processing-time band, or
            a NOC code looks wrong, please tell us — we&apos;ll cross-check
            against the IRCC source and fix within 24 hours.
          </p>
          <p className="text-sm text-gray-300">
            Click the floating <strong>💬 Feedback</strong> button on any page,
            or email <a href="mailto:hello@ircctracker.org" className="text-blue-400 hover:text-blue-300 underline decoration-dotted">hello@ircctracker.org</a>.
            Include the URL and a screenshot if you can.
          </p>
        </section>

        <section className="canada-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">🛠 Built by</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            IRCC Tracker is a free, independent project built and maintained
            by Mahesh Emudapuram, an immigrant to Canada. The code that runs
            this site is open about its sources (this page) and its data
            freshness (the banner at the top of every page).
          </p>
          <p className="text-sm text-gray-400">
            See the <Link href="/about" className="text-blue-400 hover:text-blue-300 underline decoration-dotted">About page</Link> for the longer story.
          </p>
        </section>

      </article>
    </PageLayout>
  );
}
