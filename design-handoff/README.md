# Idle Check: balíček pro Claude Code

Obsah
- `CLAUDE_CODE_BRIEF.md`: hlavní zadání (kontext, pravidla, design tokeny, rozhodnutí). Anglicky, protože se kopíruje do kódu.
- `prompts/00` až `04`: pět fází. Spouštěj je po jedné.
- `design-reference/*.html`: všechny obrazovky z návrhu. Otevři v prohlížeči (fonty se stahují z internetu).
- `assets/`: OBD logo (vektor), dvě auta (roadster, sedan) a `pin-slots.json` s pozicemi pinů.

Kroky
1. Složku `design-handoff` vlož do kořene repa, vedle `package.json`.
2. Ověř, že máš lokálně soubor `.env` s klíči (Stripe, Anthropic, Supabase, `VITE_*`). Je v `.gitignore`. Pokud chybí, zkopíruj hodnoty z Vercelu (Settings, Environment Variables). Platba testovací kartou funguje jen s testovacími klíči.
3. GitHub Desktop: pracovní strom musí být čistý (nic necommitnuté), jsi na `main`.
4. Otevři Claude Code v kořeni repa a vlož startovací prompt níže.
5. Po každé fázi: `npm run dev`, projdi obrazovku na mobilní šířce (390 px) i na desktopu, pak commit. Teprve potom další fáze.
6. Po fázi 4: projdi celý tok lokálně (úvodní stránka, načítání, preview, platba testovací kartou 4242 4242 4242 4242, načítání po platbě, report) a také `/?demo=true` a sdílený odkaz `/report/...`. Pak push na `main`.
7. Po push zkontroluj ve Vercelu, že build prošel. Potom složku `design-handoff` smaž a commitni.

Návrat zpět: fáze 0 vytvoří značku `pre-design-refresh` na posledním commitu před změnami. Každá fáze je samostatný commit, takže ji v GitHub Desktop půjde vrátit zvlášť (History, pravý klik na commit, Revert).

Startovací prompt (vlož do Claude Code)
> Read design-handoff/README.md and design-handoff/CLAUDE_CODE_BRIEF.md completely before doing anything. Check that the current git branch is main and the working tree is clean, and stop if not. Then execute only design-handoff/prompts/00-foundation.md. Do not start the next phase. When done, run the build, commit, and report what you changed and where you deviated from the design.

Další fáze spouštíš stejně, jen s jiným souborem: `01-landing.md`, `02-loading.md`, `03-paywall.md`, `04-report.md`.
