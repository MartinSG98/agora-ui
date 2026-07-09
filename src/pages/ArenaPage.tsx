// Diagnostic view proving the stream plumbing (step 5). Step 6 replaces
// this with the real arena (design screen 1b).

import { useParams } from "react-router-dom";
import {
  DebateStreamProvider,
  useDebate,
} from "../stream/DebateStreamContext";

function StreamDump() {
  const { state, mode } = useDebate();

  return (
    <div className="panel" style={{ padding: 20, maxWidth: 720 }}>
      <div className="label" style={{ marginBottom: 12 }}>
        stream diagnostics · {mode} · seq {state.seq} ·{" "}
        {state.connected ? "connected" : "closed"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.9,
          color: "var(--text-body)",
        }}
      >
        <div>topic: {state.topic ?? "—"}</div>
        <div>
          phase: {state.phase}
          {state.round > 0 ? ` (round ${state.round})` : ""}
        </div>
        <div>
          turns: {state.turns.length} · claims: {state.claims.length} · pro
          evidence: {state.sides.pro.evidenceCalls} · con evidence:{" "}
          {state.sides.con.evidenceCalls}
        </div>
        <div>
          pro: {state.sides.pro.status} · con: {state.sides.con.status}
        </div>
        {state.sides.pro.streaming && (
          <div style={{ color: "var(--pro)" }}>
            pro▍ {state.sides.pro.streaming.slice(-160)}
          </div>
        )}
        {state.sides.con.streaming && (
          <div style={{ color: "var(--con)" }}>
            con▍ {state.sides.con.streaming.slice(-160)}
          </div>
        )}
        {state.judge && (
          <div style={{ color: "var(--accent-text)" }}>
            judge: {state.judge.winner} @ {state.judge.confidence}
          </div>
        )}
        {state.failed && <div style={{ color: "var(--bad)" }}>failed: {state.failed}</div>}
        <div style={{ color: "var(--text-muted)", marginTop: 8 }}>
          {state.ticker
            .slice(-12)
            .map((entry) => `${entry.seq}:${entry.type}`)
            .join("  ")}
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  const { debateId } = useParams();
  if (!debateId) return null;

  return (
    <DebateStreamProvider debateId={debateId}>
      <StreamDump />
    </DebateStreamProvider>
  );
}
