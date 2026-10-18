# Idle Check: balíček pro Claude Code (verze 2)

Tato verze nahrazuje první. Starou složku `design-handoff` v repu smaž a vlož tuto.

Obsah
- `CLAUDE_CODE_BRIEF.md`: hlavní zadání (kontext, pravidla, tokeny, pravidla pro e-maily a soukromí).
- `prompts/00` až `05`: šest fází. Spouštěj je po jedné, v tomto pořadí.
- `design-reference/*.html`: všechny obrazovky z návrhu. Otevři v prohlížeči (fonty se stahují z internetu).
- `assets/`: OBD logo, dvě auta a `pin-slots.json` (pozice pinů).
- `sql/001-leads-and-owners.sql`: tabulky pro e-maily. Spouštíš ty sám v Supabase před fází 5.

Pořadí fází
1. `00-foundation`: tokeny, logo, auta (pokud už proběhla, přeskoč).
2. `01-landing`: dvoukrokový formulář, přepínač VIN / bez VIN, pole pro e-mail (zatím jen v UI a ve stavu).
3. `02-loading`: načítací obrazovky.
4. `03-paywall`: preview a paywall.
5. `04-report`: report s menším autem a hoverem.
6. `05-email-and-leads`: ukládání e-mailů a reportů pod e-mail (backend). Před ní spusť SQL.

Kroky
1. Ověř, že máš lokálně `.env` s klíči (Stripe, Anthropic, Supabase vč. service role, Resend, `VITE_*`). Je v `.gitignore`.
2. Pracovní strom v GitHub Desktop musí být čistý a aktivní větev `main`.
3. Po každé fázi: `npm run dev`, projdi obrazovku na mobilní šířce (390 px) i na desktopu, pak commit. Claude Code nepushuje.
4. Před fází 5: v Supabase otevři SQL Editor, vlož obsah `sql/001-leads-and-owners.sql` a spusť. Pak ověř, že oba dotazy z konce souboru vrací s anon klíčem prázdný výsledek nebo chybu oprávnění.
5. Po fázi 5 projdi celý tok lokálně (úvodní stránka, e-mail, načítání, preview, platba kartou 4242 4242 4242 4242, report, `/?demo=true`, sdílený odkaz `/report/...`). Pak push na `main` a ve Vercelu zkontroluj build.
6. Po push složku `design-handoff` smaž a commitni.

Návrat zpět: značka `pre-design-refresh` z fáze 0 a samostatný commit každé fáze (GitHub Desktop, History, Revert).

Prompt pro každou fázi (příklad fáze 1)
> Read design-handoff/README.md and design-handoff/CLAUDE_CODE_BRIEF.md completely before doing anything. Check that the current git branch is main and the working tree is clean, and stop if not. Then execute only design-handoff/prompts/01-landing.md. Do not start the next phase. When done, run the build, commit, and report what you changed and where you deviated from the design.

U dalších fází změň jen název souboru.
