// The state machine strip: one chip per phase, active chip lit cyan.
// Phases come from the backend's DebatePhase enum; the UI never advances
// them itself (ADR 0005).

import type { DebatePhase } from "../../api/types";
import { useDebate } from "../../stream/DebateStreamContext";

const PIPELINE: DebatePhase[] = [
  "opening",
  "rebuttal",
  "closing",
  "verification",
  "judging",
  "complete",
];

/** The chip row alone, reused by the desktop strip and the mobile
 * scrollable phase bar. */
export function PhaseChips() {
  const { state } = useDebate();

  return (
    <>
      {PIPELINE.map((phase, index) => {
        const active = state.phase === phase;
        let label: string = phase.toUpperCase();
        if (phase === "rebuttal" && state.rebuttalRounds > 0) {
          label = active
            ? `REBUTTAL ${state.round}/${state.rebuttalRounds}`
            : "REBUTTAL";
        }
        return (
          <span key={phase} style={{ display: "flex", alignItems: "center" }}>
            <span className={`phase-chip${active ? " active" : ""}`}>
              {label}
            </span>
            {index < PIPELINE.length - 1 && (
              <span className="phase-arrow">→</span>
            )}
          </span>
        );
      })}
      {state.failed !== null && (
        <>
          <span className="phase-arrow">→</span>
          <span className="phase-chip failed">FAILED</span>
        </>
      )}
    </>
  );
}

export default function PhasePipeline() {
  const { state } = useDebate();

  return (
    <div className="pipeline">
      <div className="pipeline-label">
        STATE
        <br />
        MACHINE
      </div>
      <div className="pipeline-chips">
        <PhaseChips />
      </div>
      {state.topic && (
        <div className="pipeline-motion">
          motion: <strong>“{state.topic}”</strong>
        </div>
      )}
    </div>
  );
}
