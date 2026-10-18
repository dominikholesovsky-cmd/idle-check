# Phase 2: loading screens

Reference: `design-reference/loading-scan-mobile.html` (before payment) and `loading-unlock-mobile.html` (after payment). Both also work on desktop: center the same card, max width about 480 px.
Code: `ScanningView.tsx`, `PaymentLoadingView.tsx`. Small allowed change in `src/routes/index.tsx` described below.

## Shared design
- Light page, no terminal window. Top: `ObdLogo` (72 px wide) whose lit pins show progress (0 to 14 pins, proportional to completed steps). Then a status pill, vehicle name (Barlow Condensed uppercase), a mono meta line, a progress bar with `role="progressbar"` and `aria-valuenow`, and a white card with the step list (done = filled primary circle with check, active = spinner, pending = empty circle).
- With `prefers-reduced-motion`: no spinner rotation; show a static ring and keep text states.

## ScanningView (before payment)
Existing contract stays: props `onDone`, `apiReady`.
- New optional props: `vehicleLabel`, `meta` (mileage and asking price line), `hasVin`.
- Steps: "Decoding VIN" (when `hasVin`, otherwise "Reading vehicle details"), "Pulling NHTSA recall records", "Matching known failure points", "Building your free preview".
- Steps complete on short timers (about 700 to 900 ms each). The last step stays active until `apiReady` is true, then complete and call `onDone` after about 400 ms. Never call `onDone` before `apiReady`.
- Footer line: "Your first 3 findings are free. No account needed."
- Small change in `index.tsx`: in `handleAnalyze`, store `{ vehicleLabel, meta, hasVin }` in state before `setPhase('scanning')` and pass it to `ScanningView`.

## PaymentLoadingView (after payment)
Existing contract stays: `onDone`, `claudePromise`, `hasError`, `onRetry`, `retryCount`. Keep the existing error card and retry behavior and restyle them in the new look (same copy, same support email).
- Pill "Payment confirmed" (green). Steps: "Verifying payment" (already done on mount, the payment is verified before this screen shows), "Reading the listing text", "Finding model-specific issues" (AI), "Pricing parts and labor", "Writing your negotiation script", "Saving your report link".
- The first two steps complete on timers. The AI step stays active until `claudePromise` settles; the last three then complete quickly (about 300 ms each). Do not show the last step complete before `claudePromise` has resolved. If it rejects or `hasError` is true, show the error card.
- New optional prop `email?: string`, passed from `index.tsx` (from the stored `AnalysisState.email`). Note under the list: with an email, "Keep this tab open. We'll also email a link to the report to {email}. It stays saved under that address."; without one, "Keep this tab open. We'll also email a link to the report to the address you paid with." This screen is only seen by the person who just paid, so showing the address here is fine. Never show it on the report page.
- Keep the existing redirect to `/report/:id` after `onDone`.

## Acceptance
- Build passes. Test the normal flow (including a slow AI response) and the error and retry path. The screen never advances early.
- Report back: any step label you changed and why.
