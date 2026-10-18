# Phase 0: foundation

Goal: add design tokens, shared components and the new header logo. No screen is redesigned yet.

Steps
1. Run `git branch --show-current`: it must print `main`. Run `git status`: the working tree must be clean. If either is not true, stop and tell me. Then create a safety tag on the current commit with `git tag pre-design-refresh` (skip if it already exists) and print the commit hash in your report.
2. Read `design-handoff/CLAUDE_CODE_BRIEF.md`, `src/styles.css`, `src/components/ghost/Navbar.tsx` and `src/routes/__root.tsx`.
3. Add the design tokens from the brief to `src/styles.css`. Reuse existing variables when the value already matches (primary, background, fonts). Verify Barlow, Barlow Condensed (600, 700) and JetBrains Mono (500, 700) are loaded; add what is missing, with `font-display: swap`.
4. Create `src/components/ghost/ObdLogo.tsx` from `design-handoff/assets/obd-logo.svg` with the props from the brief. Pins must be separate elements so `litPins` can color them. Provide an accessible name only when the logo is not decorative.
5. Create `src/components/ghost/CarIllustration.tsx` from `assets/roadster.svg` and `assets/sedan.svg`. Use unique clipPath ids per instance (use `useId`). Body fill uses the primary token.
6. Create `src/lib/ghost/constants.ts` as described in the brief.
7. Update `Navbar.tsx`: add a 36 px white rounded chip (border `#e5e4e2`, radius 10) with `ObdLogo` (24 px wide) before the wordmark, exactly like the header in any file in `design-reference`. Keep the existing props, the `Link` vs button behavior and the sticky blurred background. Header height 64 px.

Do not
- Redesign any screen yet. Do not touch `LandingView`, the loading views, `FreePreviewView` or the report.

Acceptance
- `npm run build` passes.
- Every existing screen still works; the only visible change is the logo chip in the header.
- `ObdLogo` and `CarIllustration` render correctly in a quick temporary test (remove the test afterwards).

Report back: files created or changed, any font or token conflicts you found, anything that deviated from the design.
