# Phase 1: landing page, two steps, email field

Reference (open in a browser): `landing-mobile-step1.html` (VIN mode), `landing-mobile-step1-novin.html`, `landing-mobile-step2.html`, `landing-desktop.html` (VIN mode), `landing-desktop-novin.html`, `landing-desktop-step2.html`.
Code: `src/components/ghost/LandingView.tsx`, plus the small `src/routes/index.tsx` changes listed below. Read the data and privacy rules in the brief first.

## Layout
- Mobile: header, hero text, illustrated sample card, step card, "Works with listings from", "How it works" list, footer.
- Desktop (wide, not two narrow columns):
  - Full-bleed band `#ece9e1` (1px bottom border `#e0ddd4`), inner container max 1200 px with 48 px side padding. Left: pill, H1 (62 px Barlow Condensed uppercase), paragraph, three checkmarks. Right: the sample card (see "Sample card" below).
  - Finder bar: white card, radius 20, max width 1104, overlapping the band's bottom edge by 56 px. Top row: step label with a two-segment bar (left) and the mode switch (right, about 340 px). Below: the inputs and the Continue button on one row, then the helper text and the "Missing your car or engine? Let us know" link.
  - Below the bar: "Works with listings from" as one centered row of plain text wordmarks, "How it works" as three tiles (icon, large step number, title, text), footer.
  - Step 2 is its own view (`landing-desktop-step2`): max width 1100, step label, title "Now the listing", one white card with two columns. Left: confirmed-car card (illustration, "Decoded from your VIN" when decoded, car name, engine, "Change car"). Right: Asking price, Mileage and Engine in a three-column row, Listing text, then a bottom row with Email and the "Run free inspection" button.
- Keep all UI copy from the mocks verbatim.

## Sample card (both screen sizes)
Static marketing content, labeled "Sample preview" with "Mazda RX-7" beside it. Do not make it dynamic.
- Image: copy `design-handoff/assets/cars/mazda-rx7.png` to `public/images/cars/mazda-rx7.png` and render it with a plain `<img>` (alt "Line drawing of a Mazda RX-7 coupe", explicit width and height, `loading="eager"` on the landing page). It is a palette PNG with transparency and a white body fill, so it sits directly on the `#ece9e1` panel. Do not recolor it. The generic vector `CarIllustration` is not used on the landing page anymore.
- Three pins over the image, positioned in percent from `assets/cars/mazda-rx7.slots.json` (use its `sampleFindings`, which are the app's real free-preview findings for an RX-7 from `generateIssues`; keep a code comment pointing to `src/lib/ghost/procedural.ts`). Pin 1 and 2 are HIGH (primary), pin 3 is MED (amber, dark text).
- Desktop: pins are 30 px real `<button>`s. Each has a visible label chip with a leader line (Apex seals, Coolant in oil, Catalytic converter; see the mock for placement). Hover or keyboard focus opens a tooltip (severity pill, full finding title, cost line, one-sentence hint). Tooltips for pins in the left 30% of the image align to the pin's left edge (the car faces left). Header row hint: "Hover a pin".
- Mobile: pins are 26 px, numbered, without chips. Tapping a pin selects it and shows its details in the caption bar under the image (badge, severity pill, title, cost, hint); pin 1 is selected by default. Header row hint: "Tap a pin". Under the caption: "3 free findings" with HIGH 2 and MED 1.
- Desktop stats strip under the image: Free findings 3, High 2, Medium 1.
- Respect `prefers-reduced-motion`; no animation is required.

## Behavior (keep existing logic, restructure into two steps)
Step 1, the car. A mode switch (`role="tablist"`, labels "I have a VIN" and "No VIN") chooses one of two input sets. Only the chosen set is rendered (the VIN input is not shown in manual mode and the pickers are not shown in VIN mode). Each mode keeps its own values when you switch back and forth.
- VIN mode: one VIN input. On 17 characters call the existing `decodeVin`; on success fill make, model and year as today and show the green "decoded" line; on failure show an inline error.
- No VIN mode: Make and Model selects (Supabase, existing queries and ordering) and Year (number, 1970 to 2026). Mobile: one field per row. Desktop: one row.
- Continue is enabled when the VIN decoded successfully (VIN mode) or make, model and year are set (manual mode). Enter in the VIN field triggers Continue.
- "Missing your car or engine? Let us know" (`MISSING_CAR_MAILTO`) is shown in both modes.
Step 2, the listing.
- Confirmed-car card at the top with "Change" (back to step 1, all state preserved).
- One field per row on mobile: Asking price (required, > 0 and <= 1,000,000, existing error message), Mileage (optional, existing hint), Engine (select for the model, existing behavior and sorting; keep the "Needed for accurate repair costs" helper and the missing-engine link), Listing text (optional, max 8000 characters, existing placeholder), then Email.
- Email: required, `type="email"`, `autocomplete="email"`, trimmed and lowercased on submit, simple validation with an inline error. Helper text exactly: "We'll send your report link here. Reports you unlock are saved under this email."
- Marketing opt-in: separate checkbox, unchecked by default, label "Send me occasional tips for buying used cars. Unsubscribe anytime." It must not be required.
- Legal line under the button with links to `/privacy` and `/terms`: "By continuing you agree to the Privacy Policy and Terms."
- On step change: scroll to the top of the card, move focus to the first field, announce through an `aria-live` region. "Step N of 2" label plus a two-segment bar (`aria-hidden` bar, the text carries the meaning).

## Data contract and `index.tsx`
- `LandingSubmit` gets two new fields: `email: string` and `marketingOptIn: boolean`. Everything else keeps its shape and values.
- In `index.tsx`: add optional `email` and `marketingOptIn` to `AnalysisState`, set them from `LandingSubmit` in `handleAnalyze`, and store them in the localStorage history entry like the other fields. Do not call any backend for the email in this phase.
- Critical: strip `email` and `marketingOptIn` before the state is converted to `report_json` (`handleSuccessfulAnalysis` builds `upgraded` and passes it to `attemptSaveAndEmail`). The email must never reach `saveReport` through `reportJson`. Add a small helper `toPublicReportJson(state)` and use it there. Also set `savedToEmail: true` in the public JSON when an email exists.
- Old localStorage entries without these fields must keep working.

## Keep (not in the mocks)
- "Recent Reports" history list (`history`, `onLoadHistory`): below the step card, only when history exists, same card style, compact.
- "Sample report" button in the header links to `/?demo=true`.

## Remove from this view
- `NhtsaStatus` usage and the "NHTSA LIVE · ms" badge (the component file stays); "200+ known failure points"; the "Recommended" badges on Mileage and Engine.

## Marketplace names
Plain text wordmarks (bold, `#6f6e6a`) from an array `{ name, logo?: ReactNode }` so official SVG logos can be added later. Do not draw or approximate brand logos.

## Acceptance
- Build passes. In both modes the submit produces the same `LandingSubmit` as before, plus `email` and `marketingOptIn`. Verify with a temporary console log of the object (log the email masked), then remove it.
- Test: VIN path, manual path, switching modes, "Change", invalid email, email missing, opt-in unchecked by default.
- Confirm that after a full flow the object sent to `saveReport` contains no email (check in dev tools, network tab).
- No horizontal scroll at 360 px. Tap targets 44 px.
