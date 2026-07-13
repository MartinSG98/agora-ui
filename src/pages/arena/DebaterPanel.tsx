// One side's stage panel: tinted header with model and status, the live
// or latest statement with inline citation chips, and the footer stats.

import type { Side } from "../../api/types";
import { useConfig } from "../../context/ConfigContext";
import { useDebate } from "../../stream/DebateStreamContext";
import { buildCitationMarks, renderStatement } from "./citations";
import type { SideStats } from "./useMetrics";

export const TAGS: Record<Side, string> = { pro: "▲ PRO", con: "▼ CON" };

export default function DebaterPanel({
  side,
  stats,
}: {
  side: Side;
  stats: SideStats | undefined;
}) {
  const { state } = useDebate();
  const { runtime } = useConfig();
  const maxTokens = runtime?.limits.max_response_tokens ?? "?";
  const maxEvidence = runtime?.limits.max_evidence_requests_per_phase ?? "?";
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
              {stats ? `${stats.outputTokens}/${maxTokens}` : "—"}
            </span>
          </span>
          <span>
            evidence{" "}
            <span className={evidenceAlert ? "alert" : "value"}>
              {sideState.evidenceCalls}/{maxEvidence}
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
