export function Footer() {
  return (
    <footer className="relative z-10 mt-4 border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span className="font-condensed uppercase tracking-wider">
            Idle Check™ · For informational purposes only · Always verify with a licensed mechanic
          </span>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}