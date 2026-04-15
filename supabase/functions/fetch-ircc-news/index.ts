// supabase/functions/fetch-ircc-news/index.ts
//
// Fetches IRCC news from canada.ca's official Atom feeds (maintained by the gov,
// far more stable than scraping HTML). Combines news releases, media advisories,
// and statements into one unified feed, deduped and sorted by date.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FEEDS = [
  {
    type: "News release",
    url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&type=newsreleases&sort=publishedDate&orderBy=desc&publishedDate%3E=2020-01-01&pick=50&format=atom",
  },
  {
    type: "Media advisory",
    url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&type=mediaadvisories&sort=publishedDate&orderBy=desc&publishedDate%3E=2020-01-01&pick=25&format=atom",
  },
  {
    type: "Statement",
    url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&type=statements&sort=publishedDate&orderBy=desc&publishedDate%3E=2020-01-01&pick=25&format=atom",
  },
];

type NewsItem = {
  title: string;
  url: string;
  summary: string | null;
  published_at: string;
  source: string;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseAtomFeed(xml: string, sourceLabel: string): NewsItem[] {
  const items: NewsItem[] = [];
  const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRegex.exec(xml)) !== null) {
    const body = m[1];

    const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = body.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/);
    const publishedMatch =
      body.match(/<published[^>]*>([\s\S]*?)<\/published>/) ||
      body.match(/<updated[^>]*>([\s\S]*?)<\/updated>/);
    const summaryMatch = body.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);

    if (!titleMatch || !linkMatch || !publishedMatch) continue;

    const title = decodeXmlEntities(stripTags(titleMatch[1]));
    const url = linkMatch[1].trim();
    const publishedRaw = publishedMatch[1].trim();
    const summary = summaryMatch
      ? decodeXmlEntities(stripTags(summaryMatch[1])).slice(0, 400)
      : null;

    if (!title || !url) continue;

    let publishedISO: string;
    try {
      const d = new Date(publishedRaw);
      if (Number.isNaN(d.getTime())) continue;
      publishedISO = d.toISOString();
    } catch {
      continue;
    }

    items.push({
      title,
      url,
      summary: summary && summary.length > 0 ? summary : null,
      published_at: publishedISO,
      source: sourceLabel,
    });
  }
  return items;
}

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const results: NewsItem[] = [];
    const errors: string[] = [];

    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url, {
          headers: {
            "User-Agent": "ircctracker.org news aggregator (+https://ircctracker.org)",
            "Accept": "application/atom+xml,application/xml,text/xml",
          },
        });
        if (!res.ok) {
          errors.push(feed.type + ": HTTP " + res.status);
          continue;
        }
        const xml = await res.text();
        const items = parseAtomFeed(xml, "canada.ca (" + feed.type + ")");
        results.push(...items);
      } catch (e) {
        errors.push(feed.type + ": " + String(e));
      }
    }

    const unique = new Map<string, NewsItem>();
    for (const item of results) {
      if (!unique.has(item.url)) unique.set(item.url, item);
    }
    const items = [...unique.values()].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

    if (items.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: "No items parsed from any feed",
          errors,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const { error } = await supabase
      .from("ircc_news")
      .upsert(items, { onConflict: "url", ignoreDuplicates: false });

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        found: items.length,
        errors: errors.length ? errors : undefined,
        sample: items.slice(0, 3).map((i) => ({
          title: i.title,
          published_at: i.published_at,
          source: i.source,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
