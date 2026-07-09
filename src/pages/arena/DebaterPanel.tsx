// One side's stage panel: tinted header with model and status, the live
// or latest statement with inline citation chips, and the footer stats.

import type { Side } from "../../api/types";
import { useDebate } from "../../stream/DebateStreamContext";
import { buildCitationMarks, renderStatement } from "./citations";
import type { SideStats } from "./useMetrics";

const MAX_RESPONSE_TOKENS = 600; // mirrors the backend hard limit
const MAX_EVIDENCE_PER_PHASE = 3;

export const TAGS: Record<Side, string> = { pro: "▲ PRO", con: "▼ CON" };

export default function DebaterPanel({
  side,
  stats,
}: {
  side: Side;
  stats: SideStats | undefined;
}) {
  const { state } = useDebate();
  const sideState = state.sides[side];
  const model = state.models?.[`debater_${side}`] ?? "…";

  const generating = sideState.status === "generating";
  const latestTurn = [...state.turns].reverse().find((t) => t.side === side);
  const text = generating ? sideState.streaming : (latestTurn?.content ?? "");

  const marks = buildCitationMarks(state.claims, side);

  // a side that has spoken but never once researched is a signal, not
  // decoration (the design renders CON's 0/3 in red for exactly this)
  const evidenceAlert = sideState.evidenceTotal === 0 && latestTurn !== undefined;

  return (
    <div className="debater-panel">
      <div className={`debater-head ${side}`}>
        <div>
          <span className={`debater-tag ${side}`}>{TAGS[side]}</span>
          <span className="debater-model">{model}</span>
        </div>
        <span
          className={`debater-status${generating ? ` generating ${side}` : ""}`}
        >
          {generating ? "● generating" : "idle"}
        </span>
      </div>
      <div className="debater-body">
        {text ? (
          <p className="statement">
            {renderStatement(text, side, marks)}
            {generating && <span className={`cursor ${side}`} />}
          </p>
        ) : (
          <p className="statement waiting">awaiting opening statement…</p>
        )}
        <div className="debater-stats">
          <span>
            tok{" "}
            <span className="value">
              {stats ? `${stats.outputTokens}/${MAX_RESPONSE_TOKENS}` : "—"}
            </span>
          </span>
          <span>
            evidence{" "}
            <span className={evidenceAlert ? "alert" : "value"}>
              {sideState.evidenceCalls}/{MAX_EVIDENCE_PER_PHASE}
            </span>
          </span>
          <span>
            latency{" "}
            <span className="value">
              {stats ? `${stats.latencySeconds.toFixed(1)}s` : "—"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
