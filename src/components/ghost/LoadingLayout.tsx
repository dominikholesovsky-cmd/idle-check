import type { ReactNode } from "react";
import { ObdLogo } from "./ObdLogo";

export type StepState = "done" | "active" | "pending" | "error";

export interface LoadingStep {
  label: string;
  state: StepState;
  /** Short right-aligned note, e.g. "Done", "Working". */
  tag?: string;
}

const STATE_TEXT: Record<StepState, string> = {
  done: "Completed",
  active: "In progress",
  pending: "Waiting",
  error: "Failed",
};

function Check({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Check size={16} />
      </span>
    );
  }
  if (state === "active") {
    // Spinner; with reduced motion it stays a static ring.
    return (
      <span
        aria-hidden="true"
        className="h-7 w-7 shrink-0 animate-spin rounded-full border-[3px] border-[#ecd0d1] border-t-primary motion-reduce:animate-none"
      />
    );
  }
  if (state === "error") {
    return <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border-[3px] border-primary" />;
  }
  return <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border-2 border-[#d4d2cc]" />;
}

interface LoadingLayoutProps {
  pill: ReactNode;
  pillClassName?: string;
  title: string;
  subtitle?: ReactNode;
  progressLabel: string;
  stepLabel: string;
  timeLabel: string;
  steps: LoadingStep[];
  dense?: boolean;
  /** Screen reader announcement for the current state. */
  liveMessage: string;
  children?: ReactNode;
}

export function LoadingLayout({
  pill,
  pillClassName = "border-card-border bg-chip text-primary",
  title,
  subtitle,
  progressLabel,
  stepLabel,
  timeLabel,
  steps,
  dense = false,
  liveMessage,
  children,
}: LoadingLayoutProps) {
  const total = steps.length;
  const done = steps.filter((s) => s.state === "done").length;
  const hasActive = steps.some((s) => s.state === "active");
  const progress = Math.min(100, Math.round(((done + (hasActive ? 0.5 : 0)) / total) * 100));
  const pins = Math.round((progress / 100) * 14);

  return (
    <section
      className="relative z-10 flex min-h-[calc(100vh-65px)] flex-col justify-center px-4 py-6 text-ink"
      style={{
        backgroundColor: "#f5f4f0",
        backgroundImage: "radial-gradient(circle, #c8c4bc 0.8px, transparent 0.8px)",
        backgroundSize: "20px 20px",
      }}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-[18px] text-ink">
          <ObdLogo size={72} litPins={pins} />
        </div>

        <span
          className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 font-condensed text-[13px] font-bold uppercase tracking-[0.12em] ${pillClassName}`}
        >
          {pill}
        </span>

        <h1 className="mt-3.5 font-condensed text-[30px] font-bold uppercase leading-none tracking-[0.01em]">
          {title}
        </h1>
        {subtitle}

        <div className={dense ? "mt-5" : "mt-6"}>
          <div
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-1.5 overflow-hidden rounded-full bg-card-border"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex justify-between text-[13px] text-muted-text">
            <span>{stepLabel}</span>
            <span>{timeLabel}</span>
          </div>
        </div>

        <ol
          className={`overflow-hidden rounded-card-sm border border-card-border bg-white ${dense ? "mt-4" : "mt-5"}`}
        >
          {steps.map((step) => (
            <li
              key={step.label}
              aria-current={step.state === "active" ? "step" : undefined}
              className={`flex items-center gap-3.5 border-b border-card-border px-4 last:border-b-0 ${
                dense ? "py-3.5" : "py-4"
              } ${step.state === "active" ? "bg-[#fbfaf7]" : ""}`}
            >
              <StepIcon state={step.state} />
              <span
                className={`min-w-0 flex-1 font-mono text-sm ${
                  step.state === "active" ? "font-bold" : "font-medium"
                } ${step.state === "pending" ? "text-muted-text" : ""}`}
              >
                {step.label}
                <span className="sr-only"> — {STATE_TEXT[step.state]}</span>
              </span>
              {step.tag && (
                <span
                  aria-hidden="true"
                  className={`font-mono text-xs ${
                    step.state === "active" || step.state === "error" ? "text-primary" : "text-muted-text"
                  }`}
                >
                  {step.tag}
                </span>
              )}
            </li>
          ))}
        </ol>

        {children}
      </div>
    </section>
  );
}
