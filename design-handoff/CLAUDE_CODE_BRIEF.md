# Idle Check design refresh: brief for Claude Code

## Context
- App: TanStack Start, React 19, Tailwind 4, shadcn/ui, deployed on Vercel. It is live and takes real payments (Stripe $4.99 per report). Work directly on `main`. The site is currently paused (no live traffic), but this is the production repo with real payment code, so commit after every phase: each phase must be revertible on its own.
- Design reference: `design-handoff/design-reference/*.html`. Open them in a browser. They are the source of truth for layout, spacing, hierarchy and UI copy. The sample data in them is placeholder (a 2003 Mazda MX-5 on the landing page, a 2018 BMW 330i in the report). Real data always comes from props and state.
- Goal: apply the new visual design and the two-step landing form without changing business logic.

## Do not change
- Server functions and their behavior: `analyzeVehicle`, `fetchRecalls`, `createCheckoutSession`, `verifyStripeSession`, `saveReport`, `loadReportBySession`, `sendReportEmail`. Exception: phase 4 adds two optional fields to the `analyzeVehicle` result.
- Stripe flow, Supabase schema, routes, env vars, `vercel.json`, the admin bypass and `?demo=true` mode in `src/routes/index.tsx`, the PDF export logic in `ReportView.tsx`.
- Existing prop interfaces, unless a phase says to add a prop. `LandingView.onSubmit(data: LandingSubmit)` must keep exactly the same shape.

## Rules of engagement
1. One phase at a time. After each phase: `npm run build` must pass, run the dev server, check the screens, commit with a clear message, then stop and report. Do not push; I push myself.
2. Do not refactor files you do not need to touch. Do not mass-replace colors across the codebase.
3. If the design conflicts with existing behavior, keep the behavior and tell me what you found.
4. Mobile first. Verify 360, 390 and 430 px wide, and 1280 px desktop. No horizontal scroll.
5. Accessibility: visible labels on every input, 44 px minimum tap targets for buttons and links, visible focus rings, `aria-live` for step changes, `role="progressbar"` with values on progress bars, `prefers-reduced-motion` respected (no spinners or pin animation, static state instead).
6. Never hand-draw third-party brand logos. Marketplace names stay as plain text wordmarks (see phase 1).
7. Do not print or commit secrets. `.env` stays out of git.

## Mapping: design file to code
| Design file | Code |
|---|---|
| landing-mobile-step1, landing-mobile-step2, landing-desktop | `src/components/ghost/LandingView.tsx` |
| loading-scan-mobile | `src/components/ghost/ScanningView.tsx` |
| loading-unlock-mobile | `src/components/ghost/PaymentLoadingView.tsx` |
| paywall-mobile-top, paywall-mobile-unlock, paywall-desktop | `src/components/ghost/FreePreviewView.tsx` |
| report-mobile, report-desktop | `ReportView.tsx`, `RecommendationCard.tsx`, `InspectionChecklist.tsx`, `RepairCostTracker.tsx`, `NegotiationScript.tsx`, `RecallSection.tsx` |
| header with logo chip (all files) | `src/components/ghost/Navbar.tsx` |

## Design tokens
Add them as CSS variables in `src/styles.css` and expose them through the Tailwind theme. Use them in every file you touch. Existing hardcoded zinc/gray values in untouched files stay as they are.

| Token | Value |
|---|---|
| page background | `#f5f4f0` with the existing dotted pattern (20px grid, `#c8c4bc` dots) |
| ink | `#121212` |
| text secondary | `#3f3f3d` |
| muted text | `#646360` (never lighter on beige) |
| card border | `#e5e4e2`; input border `#d9d7d1` |
| panel (illustration backdrop) | `#ece9e1`, border `#e0ddd4` |
| chip background | `#f2f2ef` |
| primary | `#b32228` (existing primary); hover `#991b1b`; dark text on tint `#8f1b20`; tint `#fdf2f1` with border `#f1d2d0` |
| severity HIGH | background primary, text white |
| severity MED | background `#f59e0b`, text `#121212` (white on amber fails contrast) |
| severity LOW | background `#e5e4e2`, text `#3f3f3d` |
| success | text `#1d6b43`, background `#e9f4ee`, border `#cfe5d8`; market band fill `#8cc7a6` |
| radii | cards 14 to 16, hero panels 20, inputs and buttons 10, pills 999, small tags 4 |
| fonts | Barlow (body), Barlow Condensed 600/700 (labels: uppercase, letter-spacing 0.12em; headings), JetBrains Mono 500/700 (VIN, prices, numbers). Verify they are loaded with those weights. |
| type | minimum 12 px anywhere, body 15 to 16 px, tap targets 44 px |

## Shared building blocks (created in phase 0)
- `ObdLogo`: vector from `assets/obd-logo.svg`. Props: `size`, `litPins` (0 to 14, pins filled with primary, the rest ink), `className`. Uses `currentColor` for the outline.
- `CarIllustration`: `assets/roadster.svg` and `assets/sedan.svg` as React components. Body color uses the primary token. Props: `body: 'roadster' | 'sedan'`, `viewBox` override (the mobile report crops the sedan to `236 64 252 150`).
- `src/lib/ghost/constants.ts`: `PRICE_USD = 4.99`, `SUPPORT_EMAIL = 'idlecheckapp@gmail.com'`, `MISSING_CAR_MAILTO` (subject `Missing car or engine`, body `Hi, I could not find my car or engine:`). Replace hardcoded `$4.99` only in files you touch.

## Decisions already made (do not re-open)
- Landing form is two steps. Step 1 is the car, step 2 is the listing.
- The free preview never states how many findings are locked (the old "12 additional findings" copy is removed, because the paid analysis returns a different set of 5).
- The report defaults to HIGH-severity findings pre-ticked, so the repair budget and offer are not $0 on first view.
- One shared offer calculation for the whole report (see phase 4).

## Decisions to confirm with me before you implement them
1. The report design has no left section navigation. Default: remove it, keep the thin fixed top scroll-progress bar.
2. The separate "Maintenance Roadmap" section is replaced by a per-finding label (Immediate = "Fix before buying", Soon = "Within 3 months", Monitor = "Keep an eye on"). Default: stop rendering the roadmap section, keep `recommendation.roadmap` in the data model.
If I have not answered, use the defaults above and list them in your report.

## Known issue spotted while reading the code (fix in phase 4)
The PDF verdict badge colors in `ReportView.tsx` are keyed `BUY`, `NEGOTIATE`, `SKIP`, `CAUTION`, but verdict values are `buy`, `negotiate`, `walkaway`. A walkaway verdict falls back to gray. Map `walkaway` to the primary red and `buy` to green in the PDF.
