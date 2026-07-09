// One side's stage panel: tinted header with model and status, the live
// or latest statement with inline citation chips, and the footer stats.

import { Fragment, type ReactNode } from "react";
import type { Side } from "../../api/types";
import { useDebate } from "../../stream/DebateStreamContext";
import type { SideStats } from "./useMetrics";

const MAX_RESPONSE_TOKENS = 600; // mirrors the backend hard limit
const MAX_EVIDENCE_PER_PHASE = 3;

const TAGS: Record<Side, string> = { pro: "▲ PRO", con: "▼ CON" };

const CITATION = /\(source:\s*([\d\s,]+)\)/g;

/** Replace "(source: 123, 456)" citations with per-source chips. A chip
 * gets ✓ when a fact-check verdict supported that source for this side,
 * and ✗ when it came back fabricated. */
function renderStatement(
  text: string,
  side: Side,
  marks: Map<string, "ok" | "bad">,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    nodes.push(text.slice(last, match.index));
    const ids = match[1]
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    ids.forEach((id, i) => {
      const mark = marks.get(id);
      nodes.push(
        <Fragment key={`${match.index}-${id}`}>
          {i > 0 && " "}
          <span className={`cite-chip ${side}`}>
            src:{id}
            {mark === "ok" && " ✓"}
            {mark === "bad" && " ✗"}
          </span>
        </Fragment>,
      );
    });
    last = match.index + match[0].length;
  }
  nodes.push(text.slice(last));
  return nodes;
}

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

  const marks = new Map<string, "ok" | "bad">();
  for (const claim of state.claims) {
    if (claim.side !== side || !claim.source_id) continue;
    if (claim.verdict === "supported") {
      if (!marks.has(claim.source_id)) marks.set(claim.source_id, "ok");
    } else if (
      claim.verdict === "not_found" ||
      claim.verdict === "source_not_found"
    ) {
      marks.set(claim.source_id, "bad");
    }
  }

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
