# Phase 4: report

Reference: `design-reference/report-mobile.html`, `report-desktop.html`. Pin positions and crop: `assets/pin-slots.json`. The hover behavior works live in the HTML previews (CSS only): open `report-desktop.html` and hover the pins and the list rows.
Code: `ReportView.tsx`, `RecommendationCard.tsx`, `InspectionChecklist.tsx`, `RepairCostTracker.tsx`, `NegotiationScript.tsx`, `RecallSection.tsx`, and one optional addition in `src/lib/api/analyzeVehicle.ts`. Read the data and privacy rules in the brief first.
Do it in two sub-steps and commit between them: 4A logic, then 4B UI.

## 4A: logic (no visual change yet)
1. One offer calculation. Today the tracker and the message compute the offer separately with different rounding. Compute once in `ReportView`: `repairTotal = round100(partsTotal + labourTotal)`, `suggestedOffer = max(0, round100(askingPrice - 0.65 * repairTotal))`. Pass both down; remove the duplicates.
2. Default selection: tick all HIGH-severity issues on mount and when `issues` changes.
3. Order: sort issues by severity (HIGH, MED, LOW), then original order. The position after sorting is the finding number shared by the list and the pins.
4. Urgency labels: Immediate = "Fix before buying", Soon = "Within 3 months", Monitor = "Keep an eye on".
5. Optional market range: extend the `analyzeVehicle` JSON with optional numbers `marketValueLow` and `marketValueHigh` (USD): one line in the prompt, the parsed result, `AnalysisState`, the saved report JSON, and the props of `ReportView`. Tolerate missing values everywhere (old saved reports, demo data, failed parsing). Keep `marketValueNote`. Update `DEMO_ANALYSIS` with 16200 and 17800, and fix its brake fluid issue category to "Chassis & Suspension" (it is mislabeled as Engine & Drivetrain).
6. `bodyStyleFor(vehicle)` returns `'roadster'` for models matching `/miata|mx-?5|s2000|z[34]\b|boxster|slk|solstice|mr-?2|4c|r8/i`, otherwise `'sedan'`.
7. Pins: for each sorted finding, take the next free slot of its category zone and body style from `pin-slots.json` (order as listed). No free slot means no pin. The car is always the cropped view (`viewBox` from the file) on every screen size.
8. Shared interaction state in `ReportView`: `activeFinding: number | null` (hover or focus or tap) used by the car, the list rows and the mobile caption.

## 4B: UI (follow the mocks)
Desktop order: title row (name, meta, "Saved to your email" chip only when `savedToEmail` is true, asking price), hero row, then two columns.
- Hero row: left white verdict card (verdict pill, headline, summary, price ruler; no copy button here). Right column: compact car card (title "Findings on the car", hint "Hover a pin", the cropped car with numbered pins, legend), then the red flags card (hidden when none).
- Main row: left the findings list; right a sticky column (`top: 24px`): offer card (suggested offer, asking line, repair budget with parts/labor bar, "Message to the seller" bubble, copy button), then the recalls card.
- The old three-tile row and the left section navigation are gone. Keep the thin fixed top scroll-progress bar.
Mobile order: title block (with the same chip), car card with a caption bar, verdict card (summary clamped to 3 lines, "Read full verdict" expands), offer card (offer, price ruler, repair budget, copy button), red flags, findings, message bubble, recalls, disclaimer.

Pins, tooltip and list link
- Pin: 26 px circle, severity colors, 2 px white border, a real `<button>` with `aria-label="Finding N: title"`, positioned in percent of the crop.
- Desktop: hover or keyboard focus opens a tooltip above the pin (about 236 px wide: severity pill, title, "$min–max parts · N h labor", "Click to jump to the finding"). Pins past 65% of the width align the tooltip to the right edge. Click or Enter scrolls to the finding row, expands it and focuses it. Hovering a row highlights its pin (3 px ink ring) and hovering a pin highlights its row (`#fff8e8`), through `activeFinding`.
- Mobile: tapping a pin sets `activeFinding` and shows its description in the caption bar under the car (badge, title, cost, "Details" link that scrolls and expands the row). The first finding is selected by default.
- Keep pins from overlapping: slot positions already guarantee it at 330 px card width.

Other requirements
- Verdict pill from `recommendation.verdict`: buy (green `#1d6b43`, white text), negotiate (amber, dark text), walkaway (primary red, white text, label "WALK AWAY"). Headline and summary from `recommendation`.
- Price ruler: markers for your offer and the asking price, plus the market band when both market numbers exist. Domain: lowest of (offer, market low) minus 5% of asking, rounded down to $500, up to the highest of (asking, market high) plus 5% of asking, rounded up to $500. Show the market label only when the band exists; show `marketValueNote` as a small caption when present.
- Budget bar: parts versus labor of the ticked findings (existing sums, $120/h).
- Findings list: flat (the three category accordions go away). Row: checkbox, numbered badge in the severity color, severity pill, urgency label, title, parts range, labor hours. The first HIGH finding starts expanded (explanation plus its parts: name, `#partNumber · source`, price). Other rows expand on tap. Rows without parts show only the explanation.
- Recalls card reuses the existing `RecallSection` data, live-data badge and empty state. Message bubble keeps the existing generator, only the presentation changes (primary-colored outgoing bubble, copy button, toast as today).
- Keep: PDF export (logic untouched, see the brief for the one color-mapping fix), share modal and link, `saveError` banner with retry, the Demo badge, `isSharedView`, compatibility with `src/routes/report.$id.tsx`. Share and PDF go in the title block (icon buttons on mobile, labeled buttons on desktop); Navbar keeps New report.
- The report must never show the owner's email.

## Per-model car images (new)
Besides the generic vector cars, the report can show a real line drawing for models that have one. Today only the Mazda RX-7 does (`assets/cars/mazda-rx7.png` and `mazda-rx7.slots.json`; see `assets/cars/README.md`).
- Create `src/lib/ghost/carImages.ts`: a registry `{ match: RegExp, make: RegExp, src, slots }` and `carImageFor(vehicle)` returning the entry or `null`. RX-7 matches when make is Mazda and model matches `/rx-?7/i`. Copy the PNG to `public/images/cars/` and the slots JSON next to the registry.
- `CarIllustration` (or a small wrapper) renders the image when `carImageFor` returns an entry, otherwise the generic vector from `bodyStyleFor`. For image cars, show the whole image (no crop), position pins in percent from the image's own slots, and use the same assignment rule, severity colors, hover tooltip, row highlight and mobile caption as the generic car. Pins 30 px on desktop and 26 px on mobile. The car faces left, so tooltips for pins in the left 30% align to the pin's left edge and pins in the right 35% align to the right edge.
- Use `carImageFor` in the landing step 2 "confirmed car" card as well (image when available, otherwise the generic vector), so the two screens agree.
- Do not add images for other models. The registry only needs to support them.

## Acceptance
- Build passes. Test with demo mode, a real flow through the admin bypass, and an old saved report opened through `/report/:id` (no market numbers, no `savedToEmail`; must not break).
- Ticking and unticking findings updates the budget bar, offer, ruler and message together and they always agree.
- Pins and list numbers match; hover, focus and tap behave as described; no horizontal scroll at 360 px.
- Report back: every deviation, and the two decisions you defaulted.
