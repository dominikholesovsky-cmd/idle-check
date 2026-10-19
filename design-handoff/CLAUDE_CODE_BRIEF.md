# Idle Check design refresh: brief for Claude Code (v2)

## Context
- App: TanStack Start, React 19, Tailwind 4, shadcn/ui, deployed on Vercel. Real payments (Stripe, $4.99 per report). Work directly on `main`. The site is paused (no live traffic) but this is the production repo with real payment code: commit after every phase so each phase is revertible on its own. Do not push; I push myself.
- Design reference: `design-handoff/design-reference/*.html`. Open them in a browser. They are the source of truth for layout, spacing, hierarchy and UI copy. Data in them is placeholder (2003 Mazda MX-5 on the landing page, 2018 BMW 330i in the report, `you@example.com`). Real data always comes from props and state.
- Goal: apply the new design, the two-step landing form with email capture, and persist emails and reports per email, without breaking existing business logic.

## Do not change
- Business behavior of `analyzeVehicle`, `fetchRecalls`, `verifyStripeSession`, `loadReportBySession`, `sendReportEmail`. Allowed exceptions: phase 4 adds two optional fields to the `analyzeVehicle` result; phase 5 changes `saveReport` and `createCheckoutSession` and adds `captureLead`.
- Stripe flow, routes, env vars, `vercel.json`, the admin bypass and `?demo=true` mode in `src/routes/index.tsx`, the PDF export logic in `ReportView.tsx` (it is redesigned later, separately).
- Existing prop interfaces, unless a phase says to add a prop.

## Rules of engagement
1. One phase at a time. After each: `npm run build` passes, run the dev server, check the screens, commit with a clear message, stop and report.
2. Do not refactor files you do not need to touch. Do not mass-replace colors across the codebase.
3. If the design conflicts with existing behavior, keep the behavior and tell me.
4. Mobile first. Verify 360, 390 and 430 px, and 1280 px desktop. No horizontal scroll.
5. Accessibility: visible labels, 44 px tap targets, visible focus rings, `aria-live` for step changes, `role="progressbar"` with values, `prefers-reduced-motion` respected.
6. Never hand-draw third-party brand logos. Marketplace names stay as plain text wordmarks.
7. Never print or commit secrets. `.env` stays out of git.

## Data and privacy rules (apply in every phase)
1. Email is personal data. It must never be placed in `report_json`, in any column of the `reports` table, in the URL, in a console log (mask it as `j***@example.com` if logging is needed), or in any client-readable table. Reason: `/report/:id` is loaded in the browser with the public anon key and `reports` has a public SELECT policy, so everything in `reports` is readable by anyone.
2. Before an `AnalysisState` is turned into `report_json` (in `handleSuccessfulAnalysis` and anywhere else), strip `email` and `marketingOptIn`.
3. The report page never shows the owner's email, because its URL is shareable. The design uses the text "Saved to your email", shown only when `report_json.savedToEmail === true`.
4. Marketing consent is optional and defaults to unchecked. Do not send any marketing email in this project. Sending needs an unsubscribe link and an updated privacy policy first, which I will handle.
5. The new tables `leads` and `report_owners` have Row Level Security on and no policies. Only server functions with the service role key touch them. Those functions must fail closed when the service role key is missing (never fall back to the anon key).

## Mapping: design file to code
| Design file | Code |
|---|---|
| landing-mobile-step1, landing-mobile-step1-novin, landing-mobile-step2, landing-desktop, landing-desktop-novin, landing-desktop-step2 | `src/components/ghost/LandingView.tsx` (+ small changes in `src/routes/index.tsx`) |
| loading-scan-mobile | `ScanningView.tsx` |
| loading-unlock-mobile | `PaymentLoadingView.tsx` |
| paywall-mobile-top, paywall-mobile-unlock, paywall-desktop | `FreePreviewView.tsx` |
| report-mobile, report-desktop | `ReportView.tsx`, `RecommendationCard.tsx`, `InspectionChecklist.tsx`, `RepairCostTracker.tsx`, `NegotiationScript.tsx`, `RecallSection.tsx` |
| header with logo chip (all files) | `Navbar.tsx` |

## Design tokens
Add as CSS variables in `src/styles.css` and expose through the Tailwind theme. Use them in every file you touch. Hardcoded zinc/gray values in untouched files stay.

| Token | Value |
|---|---|
| page background | `#f5f4f0` with the existing dotted pattern (20px grid, `#c8c4bc` dots) |
| ink | `#121212`; text secondary `#3f3f3d`; muted `#646360` (never lighter on beige) |
| card border | `#e5e4e2`; input border `#d9d7d1` |
| panel (illustration backdrop, desktop hero band) | `#ece9e1`, border `#e0ddd4` |
| chip background | `#f2f2ef` |
| primary | `#b32228`; hover `#991b1b`; dark on tint `#8f1b20`; tint `#fdf2f1` with border `#f1d2d0` |
| severity HIGH / MED / LOW | primary + white / `#f59e0b` + `#121212` / `#e5e4e2` + `#3f3f3d` |
| success | text `#1d6b43`, background `#e9f4ee`, border `#cfe5d8`; market band `#8cc7a6` |
| row highlight (hover link between pin and list) | `#fff8e8` |
| radii | cards 14 to 16, hero panels 18 to 20, inputs and buttons 10, pills 999, tags 4 |
| fonts | Barlow (body), Barlow Condensed 600/700 (labels: uppercase, letter-spacing 0.12em; headings), JetBrains Mono 500/700 (VIN, prices, numbers). Verify they load with those weights. |
| type | minimum 12 px, body 15 to 16 px, tap targets 44 px |

## Shared building blocks (phase 0)
- `ObdLogo` (`size`, `litPins` 0 to 14, `className`), vector from `assets/obd-logo.svg`.
- `CarIllustration` (`body: 'roadster' | 'sedan'`, `viewBox` override), from `assets/roadster.svg` and `assets/sedan.svg`, body color = primary token, unique clipPath ids via `useId`.
- Car images: generic vector cars for every model, plus an optional line-drawing PNG per model (only Mazda RX-7 exists now, in `assets/cars/`). A model without an image always falls back to the generic vector. Never show a car image that does not match the vehicle in a report. The landing page sample card is the only place that shows the RX-7 regardless of the vehicle, because it is a labeled sample.
- `src/lib/ghost/constants.ts`: `PRICE_USD = 4.99`, `SUPPORT_EMAIL = 'idlecheckapp@gmail.com'`, `MISSING_CAR_MAILTO` (subject `Missing car or engine`, body `Hi, I could not find my car or engine:`).

## Decisions already made (do not re-open)
- Landing form is two steps: step 1 the car (mode switch "I have a VIN" / "No VIN", only the chosen mode's inputs are rendered), step 2 the listing plus email.
- Email is required, asked in step 2 right before the submit button. Marketing opt-in is a separate optional unchecked checkbox.
- The free preview never states how many findings are locked.
- The report pre-ticks HIGH-severity findings, uses one shared offer calculation, and shows the car as a small cropped card with hover or tap descriptions.
- The report has no left section navigation; keep the thin fixed top scroll-progress bar. The separate Maintenance Roadmap section is replaced by a per-finding label; keep `recommendation.roadmap` in the data. If I have not answered otherwise, use these defaults and list them in your report.

## Known issue spotted while reading the code (fix in phase 4)
PDF verdict badge colors in `ReportView.tsx` are keyed `BUY`, `NEGOTIATE`, `SKIP`, `CAUTION`, but verdict values are `buy`, `negotiate`, `walkaway`. A walkaway verdict falls back to gray. Map `walkaway` to primary red and `buy` to green in the PDF. The PDF itself gets a full redesign later; do not restyle it now.
