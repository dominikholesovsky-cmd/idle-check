import { useEffect, useRef, useState } from "react";
import { ArrowLeft, PlusCircle, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ObdLogo } from "./ObdLogo";
import { useAccount } from "@/lib/account";

const LOGO_CLASS =
  "inline-flex min-h-[44px] items-center gap-2.5 font-mono text-sm font-bold uppercase tracking-tight transition-opacity hover:opacity-70 sm:text-base";

function Wordmark() {
  return (
    <>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-card-border bg-white text-ink">
        <ObdLogo size={24} />
      </span>
      <span>
        <span className="text-zinc-950">IDLE</span>
        <span className="mx-1.5 text-[#9CA3AF]">//</span>
        <span className="text-zinc-950">CHECK</span>
      </span>
    </>
  );
}

const HEADER_LINK =
  "inline-flex h-11 items-center gap-2 rounded-lg border border-transparent px-4 font-condensed text-sm font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:border-card-border hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const HEADER_LINK_BOXED = `${HEADER_LINK} border-card-border bg-white`;

function scrollToMyReports() {
  document.getElementById("my-reports")?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("mr-email")?.focus({ preventScroll: true });
}

interface NavbarProps {
  /** Resets the app and goes home. Shown as a labeled button on desktop, an icon on mobile. */
  showBack?: boolean;
  backLabel?: "Home" | "My reports";
  onBack?: () => void;
  /** Report screens only (desktop). */
  onNewReport?: () => void;
  /** Click on the logo. Without it the logo is a plain link to "/". */
  onLogoClick?: () => void;
  /** Landing page: Sample report, My reports and the account area. */
  showAccount?: boolean;
}

function AccountArea() {
  const account = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (account.status === "signed-in") {
    const initial = (account.email ?? "?").charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={scrollToMyReports} className={`${HEADER_LINK} hidden lg:inline-flex`}>
          My reports
        </button>
        <span className="hidden h-11 items-center gap-2 rounded-lg border border-card-border bg-white pl-2 pr-3 text-sm text-text-2 lg:inline-flex">
          <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary font-condensed text-sm font-bold text-white">
            {initial}
          </span>
          <span className="max-w-[200px] truncate">{account.email}</span>
        </span>
        <button type="button" onClick={() => void account.signOut()} className={`${HEADER_LINK} hidden lg:inline-flex`}>
          Sign out
        </button>

        <div ref={menuRef} className="relative lg:hidden">
          <button
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-card-border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary font-condensed text-sm font-bold text-white">
              {initial}
            </span>
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border border-card-border bg-white p-1.5 shadow-lg">
              <div className="truncate px-3 py-1.5 text-[13px] text-muted-text">{account.email}</div>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); scrollToMyReports(); }}
                className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-[15px] font-semibold hover:bg-chip"
              >
                My reports
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); void account.signOut(); }}
                className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-[15px] font-semibold hover:bg-chip"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a href="/?demo=true" className={`${HEADER_LINK} hidden lg:inline-flex`}>
        Sample report
      </a>
      <button type="button" onClick={scrollToMyReports} className={`${HEADER_LINK} hidden lg:inline-flex`}>
        My reports
      </button>
      <button type="button" onClick={scrollToMyReports} className={`${HEADER_LINK_BOXED} px-3 lg:px-4`}>
        <User aria-hidden="true" className="h-4 w-4" />
        Sign in
      </button>
    </div>
  );
}

export function Navbar({ showBack, backLabel = "Home", onBack, onNewReport, onLogoClick, showAccount }: NavbarProps) {
  const backAria = backLabel === "My reports" ? "Back to my reports" : "Back to home";
  return (
    <header className="sticky top-0 z-40 w-full border-b border-card-border bg-page/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          {showBack && onBack && (
            <>
              <button
                type="button"
                onClick={onBack}
                aria-label={backAria}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-card-border bg-white text-ink transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              >
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onBack}
                className={`${HEADER_LINK_BOXED} hidden shrink-0 hover:border-primary lg:inline-flex`}
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                {backLabel}
              </button>
            </>
          )}
          {onLogoClick ? (
            <button type="button" onClick={onLogoClick} className={LOGO_CLASS}>
              <Wordmark />
            </button>
          ) : (
            <Link to="/" className={LOGO_CLASS}>
              <Wordmark />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {onNewReport && (
            <Button
              onClick={onNewReport}
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 border-gray-200 font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary lg:inline-flex"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Report
            </Button>
          )}
          {showAccount ? (
            <AccountArea />
          ) : (
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-3 w-3 items-center justify-center">
                <span className="absolute h-3 w-3 rounded-full bg-green-500/30 sonar-ring" />
                <span className="absolute h-3 w-3 rounded-full bg-green-500/30 sonar-ring delay-1" />
                <span className="absolute h-3 w-3 rounded-full bg-green-500/30 sonar-ring delay-2" />
                <span className="relative h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-950 sm:inline sm:text-xs">
                <span>IDLE</span>
                <span className="mx-1 text-[#9CA3AF]">//</span>
                <span>ENGINE ACTIVE</span>
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-950 sm:hidden">
                Live
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
