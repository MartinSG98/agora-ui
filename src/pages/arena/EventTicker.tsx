// The raw event stream, bottom of the console. Flagged entries (claim
// verdicts that came back anything but supported) render red.

import { useDebate } from "../../stream/DebateStreamContext";

const VISIBLE = 8;

export default function EventTicker() {
  const { state } = useDebate();
  const entries = state.ticker.slice(-VISIBLE);
  const generating =
    state.sides.pro.status === "generating" ||
    state.sides.con.status === "generating";

  return (
    <div className="ticker">
      {entries.map((entry) => (
        <span key={entry.seq}>
          <span className={`ticker-seq${entry.flagged ? " flagged" : ""}`}>
            {entry.seq}
          </span>{" "}
          {entry.type}
        </span>
      ))}
      {entries.length === 0 && <span>waiting for events…</span>}
      {generating && (
        <span>
          <span className="ticker-live">▮</span> message_delta…
        </span>
      )}
    </div>
  );
}
