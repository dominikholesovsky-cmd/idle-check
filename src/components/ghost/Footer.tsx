import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-4 border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span className="font-condensed uppercase tracking-wider">
            Idle Check™ · For informational purposes only · Always verify with a licensed mechanic
          </span>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="transition-colors hover:text-foreground"
            >
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <span>·</span>
            <a href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="transition-colors hover:text-foreground">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
