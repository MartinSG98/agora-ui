// Step-mode control: shown while the orchestrator is paused, names the
// next unit and releases it via POST /debates/{id}/advance. The bar
// disappears on the next stream event, so the flow itself confirms the
// advance — no optimistic state needed.

import { useState } from "react";
import { advanceDebate } from "../../api/client";
import { useDebate } from "../../stream/DebateStreamContext";

export default function AdvanceBar({ debateId }: { debateId: string }) {
  const { state } = useDebate();
  const [busy, setBusy] = useState(false);

  if (state.awaitingAdvance === null || state.completed || state.failed) {
    return null;
  }

  async function advance() {
    setBusy(true);
    try {
      await advanceDebate(debateId);
    } catch {
      // 409 means the unit already ran; the stream will catch us up
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="advance-bar">
      <span className="advance-text">
        ‖ paused · next up: <strong>{state.awaitingAdvance}</strong>
      </span>
      <button
        type="button"
        className="advance-btn"
        disabled={busy}
        onClick={advance}
      >
        ADVANCE ▸
      </button>
    </div>
  );
}
