import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ircctracker.org";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/processing`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/draws`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/crs`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/pathway`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/pnp`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tracker`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/funds`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/clb`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/noc`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/checklist`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/auth`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
