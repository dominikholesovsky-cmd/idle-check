export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="font-mono text-sm font-bold uppercase tracking-tight sm:text-base">
          <span>GHOST</span>
          <span className="mx-1.5 text-muted-foreground">//</span>
          <span>INSPECTOR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="hidden font-mono text-[10px] font-medium uppercase tracking-wider text-foreground sm:inline sm:text-xs">
            US Market Engine Active
          </span>
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground sm:hidden">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
