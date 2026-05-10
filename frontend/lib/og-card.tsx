import { ImageResponse } from "next/og";

/**
 * Shared Open Graph card renderer for all of IRCC Tracker.
 *
 * Why this exists: Next.js's file-convention `opengraph-image.tsx` auto-injects
 * og:image / twitter:image tags into each route segment's <head>. We want every
 * tool's preview card to follow the same template (brand colors, footer URL,
 * IRCC Tracker badge) but with tool-specific title / subtitle / accent colour
 * and emoji. Centralizing the JSX here keeps the per-route files to ~10 lines.
 *
 * Constraints to know about (these come from `next/og`'s Satori renderer):
 *   - No Tailwind. Use inline `style={...}` only.
 *   - Every parent must have `display: 'flex'` if it has multiple children.
 *   - No web fonts unless explicitly loaded with `readFile`. Default sans is OK.
 *   - Images must be base64 or full URLs.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const BG = "#0a0f1e";
const BG_GRADIENT_TOP = "rgba(213, 43, 30, 0.18)";
const TEXT_PRIMARY = "#f5f7fb";
const TEXT_SECONDARY = "#9aa4b9";
const BRAND_DOMAIN = "ircctracker.org";

export type OgCardInput = {
  /** The big headline. Keep ≤ 40 chars for visual balance. */
  title: string;
  /** One-line description below the title. ≤ 80 chars. */
  subtitle: string;
  /** Tool emoji shown in the corner badge (from lib/tools.ts). */
  emoji?: string;
  /** Hex color used for the accent bar + badge ring (from lib/tools.ts). */
  accent?: string;
  /** Override the small label in the badge ("FREE TOOL", "GUIDE", etc.). */
  badge?: string;
};

export function renderOgCard({
  title,
  subtitle,
  emoji = "🍁",
  accent = "#d52b1e",
  badge = "FREE TOOL · IRCC TRACKER",
}: OgCardInput) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          backgroundImage: `radial-gradient(1200px 600px at 0% 0%, ${BG_GRADIENT_TOP} 0%, transparent 60%)`,
          padding: "70px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: accent,
            display: "flex",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 56,
              width: 90,
              height: 90,
              borderRadius: 22,
              background: "rgba(255,255,255,0.06)",
              border: `2px solid ${accent}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {emoji}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: accent,
                letterSpacing: 2,
                display: "flex",
              }}
            >
              {badge}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: TEXT_PRIMARY,
                display: "flex",
              }}
            >
              {BRAND_DOMAIN}
            </div>
          </div>
        </div>

        {/* Spacer pushes content to vertical center-ish */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Big title */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            display: "flex",
            maxWidth: "100%",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: TEXT_SECONDARY,
            lineHeight: 1.3,
            display: "flex",
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: TEXT_SECONDARY,
              fontSize: 22,
            }}
          >
            <span style={{ fontSize: 26 }}>🍁</span>
            <span style={{ display: "flex" }}>Free • Auto-updated from IRCC • No login required</span>
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${accent}`,
              color: accent,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            ircctracker.org
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
