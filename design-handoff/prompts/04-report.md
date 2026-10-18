# Phase 4: report

Reference: `design-reference/report-mobile.html`, `report-desktop.html`. Pin positions: `assets/pin-slots.json`.
Code: `ReportView.tsx`, `RecommendationCard.tsx`, `InspectionChecklist.tsx`, `RepairCostTracker.tsx`, `NegotiationScript.tsx`, `RecallSection.tsx`, and one optional addition in `src/lib/api/analyzeVehicle.ts`.
Do this in two sub-steps and commit between them: 4A logic, then 4B UI.

## 4A: logic (no visual change yet)
1. One offer calculation. Today the tracker and the message compute the offer separately with different rounding. Compute once in `ReportView`: `repairTotal = round100(partsTotal + labourTotal)`, `suggestedOffer = max(0, round100(askingPrice - 0.65 * repairTotal))`. Pass both down; remove the duplicates in `RepairCostTracker` and `NegotiationScript`.
2. Default selection: tick all HIGH-severity issues on mount and whenever `issues` changes.
3. Order: sort issues by severity (HIGH, MED, LOW), then original order. The position after sorting is the finding number used by the list and the pins.
4. Urgency labels: Immediate = "Fix before buying", Soon = "Within 3 months", Monitor = "Keep an eye on".
5. Optional market range: extend the `analyzeVehicle` JSON with optional numbers `marketValueLow` and `marketValueHigh` (USD). Add them to the prompt as one line, to the parsed result, to `AnalysisState`, to the saved report JSON, and to the props of `ReportView`. Everything must tolerate missing values (old saved reports, the demo data, failed parsing). Keep `marketValueNote`. Update `DEMO_ANALYSIS` with 16200 and 17800.
6. Body style: `bodyStyleFor(vehicle)` returns `'roadster'` for models matching `/miata|mx-?5|s2000|z[34]\b|boxster|slk|solstice|mr-?2|4c|r8/i`, otherwise `'sedan'`.
7. Pins: for each finding, take the next free slot from `pin-slots.json` for the finding's category zone and body style. No free slot means no pin (the finding still appears in the list). On mobile only slots inside the crop `236 64 252 150` are shown.

## 4B: UI (follow the mocks)
Order on mobile: title block, car card with numbered pins and a legend, verdict card, offer card (offer, price ruler, repair budget with parts/labor bar, copy button), red flags, findings list, message bubble, recalls, disclaimer. Desktop: title row, two-column hero (car card left, verdict and ruler right), three tiles (repair budget with bar, red flag count, recall count), then two columns: red flags and findings on the left, a sticky right column with offer, message bubble and recalls.
- Verdict pill from `recommendation.verdict`: buy (green `#1d6b43`, white text), negotiate (amber, dark text), walkaway (primary red, white text, label "WALK AWAY"). Headline and summary come from `recommendation`. On mobile clamp the summary to 3 lines with a "Read full verdict" link that expands it.
- Price ruler: markers for your offer and the asking price, plus the market band when both market numbers exist. Domain: lowest of (offer, market low) minus 5% of asking, rounded down to $500, up to highest of (asking, market high) plus 5% of asking, rounded up to $500. Show the market label only when the band exists. Show `marketValueNote` as a small caption below when present.
- Budget bar: parts versus labor of the ticked findings, using the existing sums and $120/h.
- Findings list: flat list (the three category accordions go away). Row: checkbox, numbered badge in severity colors (same colors and numbers as the pins), severity pill, urgency label, title, parts range, labor hours. The first HIGH finding starts expanded: explanation plus its parts (name, `#partNumber · source`, price) from `issue.parts`. Other rows expand on tap. Rows without parts show only the explanation.
- Red flags card: hidden when there are none. Recalls card: reuse the existing `RecallSection` data and the live-data badge; keep the empty-state text.
- Message bubble: keep the existing message generator; only change the presentation (primary-colored outgoing bubble, copy button, toast as today).
- Keep: PDF export, share modal and share link, `saveError` banner with retry, the Demo badge, `isSharedView`, and compatibility with `src/routes/report.$id.tsx` (it must still render with its current props). Keep the thin fixed top scroll-progress bar. Remove the left section navigation (see the brief, decisions to confirm).
- Fix the PDF verdict badge color mapping described in the brief.
- Share, PDF and New report actions: Navbar keeps New report; place Share and PDF in the title block (icon buttons on mobile, labeled buttons on desktop).

## Acceptance
- Build passes. Test with: demo mode (`/?demo=true`), a real flow through the admin bypass, and an old saved report opened through `/report/:id` (no market numbers, must not break).
- Ticking and unticking findings updates the budget bar, the offer, the ruler and the message together, and they always agree.
- Pins and list numbers match. No pin overlaps another at 390 px.
- Report back: every deviation, plus the two decisions you defaulted.
