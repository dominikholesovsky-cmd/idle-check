import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onLogoClick?: () => void;
  showNewReport?: boolean;
  onNewReport?: () => void;
}

export function Navbar({ onLogoClick, showNewReport, onNewReport }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-[#f5f4f0]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <button
          type="button"
          onClick={onLogoClick}
          className={`font-mono text-sm font-bold uppercase tracking-tight sm:text-base ${
            onLogoClick
              ? "cursor-pointer transition-opacity hover:opacity-70"
              : "cursor-default"
          }`}
        >
          <span className="text-zinc-950">IDLE</span>
          <span className="mx-1.5 text-[#9CA3AF]">//</span>
          <span className="text-zinc-950">CHECK</span>
        </button>

        <div className="flex items-center gap-4">
          {showNewReport && (
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