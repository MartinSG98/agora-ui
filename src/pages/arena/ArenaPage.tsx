// Live Debate Arena (design screen 1b): status strip, state machine
// pipeline, the three-column stage, and the event ticker. Every part
// reads the stream through context (ADR 0004) — the only props passed
// down are side identity and footer stats.

import { useParams } from "react-router-dom";
import {
  DebateStreamProvider,
  useDebate,
} from "../../stream/DebateStreamContext";
import "./Arena.css";
import AdvanceBar from "./AdvanceBar";
import CenterColumn from "./CenterColumn";
import DebaterPanel from "./DebaterPanel";
import EventTicker from "./EventTicker";
import MobileArena from "./MobileArena";
import PhasePipeline from "./PhasePipeline";
import { useIsMobile } from "./useIsMobile";
import { useMetrics } from "./useMetrics";

function StatusStrip({ debateId }: { debateId: string }) {
  const { state, mode } = useDebate();
  const open = state.connected;

  return (
    <div className="arena-status">
      <span>
        debate {debateId} · {state.format ?? "…"} · {mode}
      </span>
      <span className="sse-status">
        <span>SSE</span>
        <span className={`sse-dot${open ? "" : " closed"}`} />
        <span className={`sse-text${open ? "" : " closed"}`}>
          {open ? `${mode === "replay" ? "replaying" : "streaming"} · seq ${state.seq}` : `closed · seq ${state.seq}`}
        </span>
      </span>
    </div>
  );
}

function ArenaView({ debateId }: { debateId: string }) {
  const { state } = useDebate();
  const metrics = useMetrics(debateId, state.turns.length);

  return (
    <div>
      <StatusStrip debateId={debateId} />
      <PhasePipeline />
      <AdvanceBar debateId={debateId} />
      {state.failed !== null && (
        <div className="failed-banner">debate failed: {state.failed}</div>
      )}
      <div className="arena-grid">
        <DebaterPanel side="pro" stats={metrics.pro} />
        <CenterColumn />
        <DebaterPanel side="con" stats={metrics.con} />
      </div>
      <EventTicker />
    </div>
  );
}

export default function ArenaPage() {
  const { debateId } = useParams();
  const mobile = useIsMobile();
  if (!debateId) return null;

  return (
    <DebateStreamProvider debateId={debateId}>
      {mobile ? <MobileArena /> : <ArenaView debateId={debateId} />}
    </DebateStreamProvider>
  );
}
