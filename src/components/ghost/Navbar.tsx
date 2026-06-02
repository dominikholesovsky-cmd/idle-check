export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="font-mono text-sm font-bold uppercase tracking-tight sm:text-base">
          <span className="text-foreground">IDLE</span>
          <span className="mx-1.5 text-[#9CA3AF]">//</span>
          <span className="text-foreground">CHECK</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 rounded-full bg-primary/30 sonar-ring" />
            <span className="absolute h-3 w-3 rounded-full bg-primary/30 sonar-ring delay-1" />
            <span className="absolute h-3 w-3 rounded-full bg-primary/30 sonar-ring delay-2" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground sm:inline sm:text-xs">
            <span>IDLE</span>
            <span className="mx-1 text-[#9CA3AF]">//</span>
            <span>ENGINE ACTIVE</span>
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground sm:hidden">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
