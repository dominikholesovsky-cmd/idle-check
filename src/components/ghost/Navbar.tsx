import { PlusCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ObdLogo } from "./ObdLogo";

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

interface NavbarProps {
  onNewReport?: () => void;
}

export function Navbar({ onNewReport }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-card-border bg-page/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between h-16 px-4 sm:px-6">
        {onNewReport ? (
          <button type="button" onClick={onNewReport} className={LOGO_CLASS}>
            <Wordmark />
          </button>
        ) : (
          <Link to="/" className={LOGO_CLASS}>
            <Wordmark />
          </Link>
        )}

        <div className="flex items-center gap-4">
          {onNewReport && (
            <Button
              onClick={onNewReport}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-gray-200 font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Report
            </Button>
          )}
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
        </div>
      </div>
    </header>
  );
}
