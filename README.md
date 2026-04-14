# 🍁 IRCC Tracker

> Free Canada immigration tools — processing times, CRS calculator, Express Entry draws, PNP tracker, and more.

**Live site:** [ircctracker.org](https://ircctracker.org)

---

## What is IRCC Tracker?

IRCC Tracker is a free web app helping people navigate Canadian immigration. Whether you're outside Canada planning to move, or already in Canada on a permit — all the tools you need are in one place, updated daily from official IRCC data.

---

## 10 Free Tools

| Tool | URL | Description |
|------|-----|-------------|
| Processing Times | `/` | Visa wait times for 180+ countries, updated daily |
| PR Draws | `/draws` | Express Entry draw history with CRS trend chart |
| CRS Calculator | `/crs` | Calculate your score with spouse, IELTS/CELPIP toggle |
| PR Pathway Finder | `/pathway` | 8-question quiz to find your best immigration stream |
| PNP Tracker | `/pnp` | Ontario, BC & Alberta provincial nominee streams |
| CLB Converter | `/clb` | Convert IELTS / CELPIP scores to CLB levels |
| NOC Code Finder | `/noc` | Search 70+ NOC 2021 codes, check Express Entry eligibility |
| Document Checklist | `/checklist` | Per-visa document checklist — saves your progress |
| Permit Expiry Tracker | `/tracker` | Know exactly when to renew your permit |
| Proof of Funds | `/funds` | Calculate how much money IRCC requires |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + custom design system
- **Database & Auth:** Supabase (PostgreSQL)
- **Payments:** Stripe ($4.99/month premium)
- **Charts:** Recharts
- **Deployment:** Vercel

---

## Project Structure

```
ircc-tracker/
└── frontend/
    ├── app/
    │   ├── page.tsx              # Home — processing times
    │   ├── draws/                # PR Draws
    │   ├── crs/                  # CRS Calculator
    │   ├── pathway/              # PR Pathway Finder
    │   ├── pnp/                  # PNP Tracker
    │   ├── clb/                  # CLB Converter
    │   ├── noc/                  # NOC Code Finder
    │   ├── checklist/            # Document Checklist
    │   ├── tracker/              # Permit Expiry Tracker
    │   ├── funds/                # Proof of Funds
    │   ├── dashboard/            # User Dashboard
    │   ├── pricing/              # Pricing page
    │   └── api/                  # Stripe webhook + checkout
    ├── components/
    │   ├── Header.tsx            # Nav with mobile hamburger menu
    │   ├── Footer.tsx            # Footer with all tool links
    │   ├── PageLayout.tsx        # Shared page wrapper
    │   ├── JourneyProgress.tsx   # Step tracker (outside/inside Canada)
    │   ├── AlertSignup.tsx       # Email alert signup
    │   ├── TrendChart.tsx        # CRS trend chart
    │   └── home/                 # Home page sections
    └── lib/
        ├── supabase.ts           # Supabase client
        ├── journey.ts            # localStorage journey state
        └── countries.ts          # Country names + dial codes
```

---

## Getting Started (Local Development)

**1. Clone the repo**
```bash
git clone https://github.com/emudamah0906/ircc-tracker.git
cd ircc-tracker/frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**4. Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deployed on Vercel. Every push to `main` triggers an automatic deployment.

```bash
git push origin main
```

---

## Features

- **Guided journey** — users pick "I want to move to Canada" or "I'm already in Canada" and get a personalized tool flow
- **Journey progress tracker** — horizontal stepper shows completed tools across sessions (localStorage)
- **Cross-tool suggestions** — every tool suggests the logical next step
- **Mobile-first** — full hamburger menu, card views, responsive on all screen sizes
- **No signup required** — all 10 tools work without an account

---

## Contributing

Issues and PRs are welcome. Please open an issue first to discuss any major changes.

---

## Disclaimer

IRCC Tracker is not affiliated with IRCC or the Government of Canada. Data is sourced from the official IRCC website for informational purposes only. Always verify information directly with IRCC before making immigration decisions.

---

Built by [Mahesh](https://github.com/emudamah0906) · [ircctracker.org](https://ircctracker.org)
