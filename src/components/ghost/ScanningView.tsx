import { useEffect, useRef, useState } from "react";
import { LoadingLayout, type LoadingStep } from "./LoadingLayout";

// Steps 0 to 2 finish on short timers. The last step waits for `apiReady`.
const STEP_MS = [800, 900, 800];
const DONE_DELAY_MS = 400;

export function ScanningView({
  onDone,
  apiReady,
  vehicleLabel,
  meta,
  hasVin = false,
}: {
  onDone: () => void;
  apiReady: boolean;
  vehicleLabel?: string;
  meta?: string;
  hasVin?: boolean;
}) {
  const labels = [
    hasVin ? "Decoding VIN" : "Reading vehicle details",
    "Pulling NHTSA recall records",
    "Matching known failure points",
    "Building your free preview",
  ];
  const lastIdx = labels.length - 1;

  // Number of completed steps, 0 to labels.length.
  const [doneCount, setDoneCount] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // Timed steps
  useEffect(() => {
    if (doneCount >= lastIdx) return;
    const t = setTimeout(() => setDoneCount((c) => c + 1), STEP_MS[doneCount] ?? 800);
    return () => clearTimeout(t);
  }, [doneCount, lastIdx]);

  // Final step completes only once the data is ready
  useEffect(() => {
    if (doneCount === lastIdx && apiReady) setDoneCount(labels.length);
  }, [doneCount, lastIdx, apiReady, labels.length]);

  // Never fires before every step, including the final one, is complete
  useEffect(() => {
    if (doneCount < labels.length) return;
    const t = setTimeout(() => onDoneRef.current(), DONE_DELAY_MS);
    return () => clearTimeout(t);
  }, [doneCount, labels.length]);

  const steps: LoadingStep[] = labels.map((label, i) => {
    if (i < doneCount) return { label, state: "done", tag: "Done" };
    if (i === doneCount) return { label, state: "active", tag: "Working" };
    return { label, state: "pending" };
  });

  const stepNumber = Math.min(doneCount + 1, labels.length);
  const liveMessage =
    doneCount >= labels.length ? "Preview ready" : `Step ${stepNumber} of ${labels.length}: ${labels[doneCount]}`;

  return (
    <LoadingLayout
      pill="Analyzing"
      title={vehicleLabel || "Your vehicle"}
      subtitle={
        meta ? <p className="mt-2 font-mono text-[13px] text-muted-text">{meta}</p> : null
      }
      progressLabel="Analysis progress"
      stepLabel={`Step ${stepNumber} of ${labels.length}`}
      timeLabel="A few seconds"
      steps={steps}
      liveMessage={liveMessage}
    >
      <p className="mt-4 text-center text-sm text-muted-text">
        Your first 3 findings are free. No account needed.
      </p>
    </LoadingLayout>
  );
}
