# Phase 1: landing page, two steps

Reference: `design-reference/landing-mobile-step1.html`, `landing-mobile-step2.html`, `landing-desktop.html`.
Code: `src/components/ghost/LandingView.tsx` only. `src/routes/index.tsx` must not need changes.

## Layout
- Mobile: header, hero text, illustrated sample card, step card (step 1), "Works with listings from", "How it works" list, footer. Desktop: two columns (text and step card left, sample card right), then a one-line "works with" row and a three-tile "How it works" row.
- Sample card is static marketing content: `CarIllustration` roadster with three labeled pins ("Rust check", "Soft top", "Timing chain") and a stats strip (NEGOTIATE, $2,290–5,220 repairs, 5 red flags). Label it "Sample report". Do not make it dynamic.
- Keep all existing UI copy that appears in the mocks, verbatim.

## Behavior (keep existing logic, move it into two steps)
Step 1: the car.
- VIN input. When 17 characters are entered (or on blur with 17), call the existing `decodeVin`. Success: fill make, model and year as it does today, show the green "decoded" line, enable Continue. Failure: inline error, user can keep typing or use the manual path.
- "No VIN? Pick make and model" reveals the manual pickers: Make and Model (Supabase, existing queries and ordering), Year (number, 1970 to 2026). On mobile one field per row, on desktop two columns.
- Continue is enabled when the VIN is decoded OR make, model and year are set. Enter in the VIN field triggers Continue.
Step 2: the listing.
- Top: confirmed-car card with a small `CarIllustration`, "Decoded from your VIN" (only when decoded by VIN), car name, engine if selected, and a "Change" link that returns to step 1 with all state preserved.
- Fields, one per row on every screen size: Asking price (required, > 0 and <= 1,000,000, existing error message), Mileage (optional, existing behavior and hint), Engine (select from Supabase for the model, existing behavior and sorting), Listing text (optional, max 8000 characters, existing placeholder).
- Primary button "Run free inspection" calls `onSubmit(data: LandingSubmit)` with exactly the same shape and values as today (including the fallback `manualText` built from year, make, model, engine).
- On a step change: scroll to top of the card, move focus to the first field, announce the step through an `aria-live` region.
- "Step N of 2" label plus a two-segment bar; `aria-hidden` on the bar, text carries the meaning.

## Keep (not in the mocks)
- "Recent Reports" history list (`history`, `onLoadHistory`). Show it below the step card, only when history exists, in the same card style, compact.
- The "Missing your car or engine? Let us know" mailto link, using `MISSING_CAR_MAILTO`. It appears under the VIN step on mobile and desktop and next to the Engine select in step 2.
- "Sample report" button in the header area links to `/?demo=true`.

## Remove from this view
- `NhtsaStatus` usage and the "NHTSA LIVE · ms" badge (the component file stays).
- "200+ known failure points" and the "Recommended" badges on Mileage and Engine.

## Marketplace names
Render Facebook Marketplace, eBay Motors, Craigslist, AutoTrader, OfferUp and CarGurus as plain text wordmarks (bold, `#6f6e6a`). Structure the data as an array `{ name, logo?: ReactNode }` so official SVG logos can be dropped in later. Do not draw or approximate brand logos.

## Acceptance
- Build passes. Submitting from the new form produces the same `LandingSubmit` object as before (compare with a console log in dev, then remove it).
- Both paths work: VIN decode path and manual make/model/year path, including going back with "Change".
- No horizontal scroll at 360 px. Tap targets are 44 px.
- Report back: anything in the mocks you could not match and why.
