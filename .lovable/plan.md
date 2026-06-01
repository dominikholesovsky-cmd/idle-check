# Ghost Inspector — Build Plan (v2)

Single-route TanStack Start app with 3 in-page views managed by local state. No backend.

## Design tokens (src/styles.css)
- `--background`: #FFFFFF, `--foreground`: #111111
- `--border`/`--muted`: #E5E7EB
- `--primary`: #B22222 (crimson), `--primary-foreground`: #FFFFFF
- Fonts (Google Fonts via `__root.tsx` head): **Inter** (sans) and **JetBrains Mono** (mono). Register as `--font-sans` / `--font-mono`.

## File structure
```
src/routes/index.tsx
src/components/ghost/
  Navbar.tsx, Footer.tsx
  LandingView.tsx, ScanningPaywallView.tsx, ReportView.tsx
  InspectionChecklist.tsx, RepairCostTracker.tsx, NegotiationScript.tsx
src/lib/ghost/
  procedural.ts, types.ts
```

## State machine (index.tsx)
`Phase = 'landing' | 'scanning' | 'paywall' | 'report'`
Shared state: `{ url, manualText, make, model, year, askingPrice, marketplace, vehicle, issues }`.

## VIEW 1 — Landing
- Hero, marketplace badges row.
- URL input.
- Collapsible "Or paste listing text manually" → textarea.
- Manual row: Make / Model / Year inputs.
- **NEW — Mandatory "Listing Price / Asking Price ($ USD)" input**: `type="number"`, `min={0}`, `step={100}`, JetBrains Mono font, leading `$` adornment. Required to enable CTA. Inline validation: show crimson helper "Asking price is required to generate your negotiation offer" if empty on submit. Zod schema: `z.coerce.number().positive().max(1_000_000)`.
- CTA: crimson "Analyze Listing & Generate Protocol". Disabled until URL or manual text/fields present AND askingPrice > 0.

## VIEW 2 — Scanning + Paywall
- Terminal scanning card (~4s, mono lines with blinking caret) → fades to paywall.
- Paywall: blurred mock report behind; two tiers ($14.99 single, $29.99 Hunter Pass with crimson "Best Value" badge); mock "Pay with Credit Card" + "Apple Pay" buttons → unlock.

## VIEW 3 — Report
- Top status bar: detected vehicle + marketplace + asking price (mono).
- **A. Inspection Checklist** — Accordion with 3 groups (Engine & Drivetrain, Chassis & Suspension, Body & Electrical). 4–5 items each from `procedural.ts`, checkbox + label + mono cost.
- **B. Repair Cost Tracker** — Sticky card, live total in JetBrains Mono.
- **C. Negotiation Script** — Readonly textarea, template:
  > "Hi — I'm seriously interested in the {year} {make} {model}. After reviewing the listing, I noted potential concerns: {checked items}. Estimated repair budget: ${repairTotal}. Given the listed price of ${askingPrice} and these required repairs, I can offer **${askingPrice − repairTotal}** cash today, ready to pick up this week. Happy to discuss."
  - **Cash offer = askingPrice − repairTotal** (clamped to min $0; if negative, show "$0 (repairs exceed asking price — recommend walking away)").
  - **Copy button behavior**: on click → copy to clipboard → button swaps to green (`bg-green-600`/`text-white`) with check icon + "Copied to Clipboard!" for **2000ms** → reverts to crimson "Copy to Clipboard". Also fires `toast.success("Negotiation script copied")`. Implemented via `useState<boolean>` + `setTimeout` with cleanup on unmount.

## Procedural logic (`procedural.ts`)
`generateIssues({ make, model, year })` returns `Issue[]` grouped by category.

**Context-aware injection rules (NEW — applied in this order, deduped):**
1. **German makes** (case-insensitive match on `bmw|audi|mercedes|mercedes-benz|vw|volkswagen|porsche`):
   - Inject electrical/sensor fault — randomly pick one: "VANOS/VVT Solenoid Failure $450" or "ABS Module Fault $600" (Engine & Drivetrain / Body & Electrical respectively).
   - Inject fluid leak: "Oil Filter Housing Gasket Leak $350" (Engine & Drivetrain).
2. **Truck/off-road** (model matches `wrangler|jeep|f-150|f150|silverado|ram|tacoma|tundra|truck|bronco`):
   - "Transfer Case Fluid Leak $250" (Engine & Drivetrain).
   - "Steering Box Play / Death Wobble Check $500" (Chassis & Suspension).
3. **Pre-2005** (year < 2005): suspension + rust set — "Suspension Bushing Wear $400", "Valve Cover Gasket Leak $250", "Subframe Surface Rust $600", "Worn Engine Mounts $350".
4. **2005–2014**: "Timing Chain Tensioner Noise $900", "Coolant Expansion Tank Crack $200", "Control Arm Bushings $450", "O2 Sensor Fault $180".
5. **≥2015**: "Infotainment Software Glitch $150", "Battery Health Degradation $250", "Brake Pad/Rotor Wear $400", "Cabin Air Filter & HVAC $180".

After injection, top up each of the 3 categories to **at least 4 items** from a generic pool so the report always looks complete. Costs always within $150–$1500.

Also: `detectMarketplace(url)` and `parseVehicle(url|text|manual)` (regex `(19|20)\d{2}\s+\w+\s+\w+` fallback to manual fields).

## Navbar / Footer / SEO
- Sticky white navbar, mono `GHOST // INSPECTOR` (slashes muted), pulsing crimson dot + "US MARKET ENGINE ACTIVE".
- Footer: low-contrast Privacy/Terms mock links + full trademark + liability disclaimers (verbatim from spec).
- Route head: title "Ghost Inspector — AI Used Car Listing Analyzer" + description + og tags.

## Out of scope
No real scraping, payments, or backend. Pure client-side mock. No Lovable Cloud required.
