import { HelpCircle } from "lucide-react";

export function HelpTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex">
      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 whitespace-normal rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
        {text}
      </div>
    </div>
  );
}
