# Phase 3: free preview and paywall

Reference: `design-reference/paywall-mobile-top.html`, `paywall-mobile-unlock.html`, `paywall-desktop.html`.
Code: `src/components/ghost/FreePreviewView.tsx`. Small allowed change in `src/routes/index.tsx`: pass two extra props.

## Props
Keep `vehicle`, `issues`, `onUnlock`, `paymentError`. Add `askingPrice: number` and `marketplace?: string`. In `index.tsx` pass `analysis.askingPrice` and `analysis.marketplace`. Omit the marketplace in the UI when it equals "the listing".

## Content and layout (follow the mocks)
- Hero card: vehicle name (Barlow Condensed uppercase), mono meta line (mileage if known, marketplace), three stat cells: Asking (from props), Verdict and Repairs (both static "Locked" with a lock icon).
- "Free findings": the first 3 issues, as today. No lock icons on them. Pill for severity, category, title, description. On mobile the description is clamped to 2 lines and the row expands on tap (accordion, `aria-expanded`). On desktop show the full text.
- "What the full report adds": five static items exactly as in the mocks (model-specific findings, seller red flags, verdict/market value/recalls, negotiation script, PDF and shareable link).
- Do not render any count of locked findings and remove the old "12 additional findings" text and the blurred fake rows.
- Unlock: price from `PRICE_USD`, button "Unlock full report" calls `onUnlock`. Show `paymentError` in an alert banner directly above the button. Disable the button and show a short "Opening checkout" state after the click so it cannot be double-clicked; re-enable when `paymentError` appears.

## Sticky unlock
- Mobile: a fixed bottom bar (price and button) with safe-area bottom padding. Hide it while the in-page unlock card is on screen (IntersectionObserver) so there are never two buttons visible.
- Desktop: the unlock panel in the right column is `position: sticky; top: 24px`.

## Acceptance
- Build passes. Clicking unlock still creates the Stripe checkout session exactly as before.
- No horizontal scroll at 360 px; the bottom bar does not cover the last content (add bottom padding to the page).
- Report back: anything you could not match and why.
