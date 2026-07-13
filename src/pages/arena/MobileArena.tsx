// Mobile arena (design screen 2b): live row, scrollable phase bar,
// motion, versus strip, then a tabbed body — STAGE (transcript feed with
// fact-check interjections), FACTS, JUDGE and EVENTS.

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ClaimVerdictValue } from "../../api/types";
import { useDebate } from "../../stream/DebateStreamContext";
import AdvanceBar from "./AdvanceBar";
import { FactCheckFeed, JudgeCard } from "./CenterColumn";
import { buildCitationMarks, renderStatement } from "./citations";
import { TAGS } from "./DebaterPanel";
import { PhaseChips } from "./PhasePipeline";

type Tab = "stage" | "facts" | "judge" | "events";

const INTERJECTION: Record<ClaimVerdictValue, { icon: string; label: string }> = {
  supported: { icon: "✓", label: "verified" },
  partially_supported: { icon: "⚠", label: "partial" },
  uncited: { icon: "⚠", label: "uncited" },
  unverifiable: { icon: "⚠", label: "unverifiable" },
  not_found: { icon: "✗", label: "fabricated" },
  source_not_found: { icon: "✗", label: "fabricated" },
};

function StageFeed() {
  const { state } = useDebate();
  const { debateId } = useParams();
  const claims = state.claims;

  return (
    <div className="m-feed">
      {state.turns.map((turn, index) => (
        <div key={index} className={`m-turn ${turn.side}`}>
          <div className="m-turn-head">
            <span className={`m-turn-tag ${turn.side}`}>
              {TAGS[turn.side]} · {turn.phase.toUpperCase()}
              {turn.round > 0 ? ` ${turn.round}` : ""}
            </span>
          </div>
          <p className="m-turn-text">
            {renderStatement(
              turn.content,
              turn.side,
              buildCitationMarks(claims, turn.side),
            )}
          </p>
        </div>
      ))}

      {(["pro", "con"] as const).map((side) => {
        const sideState = state.sides[side];
        if (sideState.status !== "generating") return null;
        return (
          <div key={side} className={`m-turn ${side}`}>
            <div className="m-turn-head">
              <span className={`m-turn-tag ${side}`}>
                {TAGS[side]} · {state.phase.toUpperCase()}
                {state.round > 0 ? ` ${state.round}` : ""}
              </span>
              <span className={`m-generating ${side}`}>● generating</span>
            </div>
            <p className="m-turn-text">
              {renderStatement(
                sideState.streaming,
                side,
                buildCitationMarks(claims, side),
              )}
              <span className={`cursor ${side}`} />
            </p>
          </div>
        );
      })}

      {claims.map((claim, index) => {
        const style = INTERJECTION[claim.verdict];
        return (
          <div key={`claim-${index}`} className="m-interjection">
            <span className={claim.verdict === "supported" ? "" : "flagged"}>
              {style.icon} fact-check: {style.label}
              {claim.source_id ? ` — src:${claim.source_id}` : ""}
            </span>
          </div>
        );
      })}

      {state.judge && debateId && (
        <div className="m-interjection">
          <Link
            to={`/debates/${debateId}/results`}
            style={{ textDecoration: "none" }}
          >
            <span>
              ⚖ verdict:{" "}
              {state.judge.winner === "draw"
                ? "draw"
                : `${state.judge.winner} wins`}{" "}
              @ {state.judge.confidence.toFixed(2)} · full results →
            </span>
          </Link>
        </div>
      )}

      {state.turns.length === 0 &&
        state.sides.pro.status === "idle" &&
        state.sides.con.status === "idle" && (
          <p className="statement waiting">awaiting opening statement…</p>
        )}
    </div>
  );
}

function EventsList() {
  const { state } = useDebate();
  return (
    <div className="m-events">
      {[...state.ticker].reverse().map((entry) => (
        <div key={entry.seq}>
          <span className={`ticker-seq${entry.flagged ? " flagged" : ""}`}>
            {entry.seq}
          </span>{" "}
          {entry.type}
        </div>
      ))}
    </div>
  );
}

export default function MobileArena() {
  const { state, mode } = useDebate();
  const { debateId } = useParams();
  const [tab, setTab] = useState<Tab>("stage");
  const open = state.connected;

  return (
    <div className="m-arena">
      <div className="m-live-row">
        <span className={`sse-dot${open ? "" : " closed"}`} />
        <span className={`sse-text${open ? "" : " closed"}`}>
          {mode === "replay" ? "REPLAY" : "LIVE"} · seq {state.seq}
        </span>
      </div>

      <div className="m-phasebar">
        <PhaseChips />
      </div>

      <div className="m-motion">
        <div className="label" style={{ marginBottom: 6 }}>
          MOTION
        </div>
        <div className="m-motion-text">{state.topic ?? "…"}</div>
      </div>

      <div className="m-versus">
        <div className="m-versus-side">
          <span className="m-turn-tag pro">▲ PRO</span>
          <span className="m-versus-model">
            {state.models?.debater_pro ?? "…"}
          </span>
        </div>
        <span className="m-versus-vs">vs</span>
        <div className="m-versus-side right">
          <span className="m-turn-tag con">CON ▼</span>
          <span className="m-versus-model">
            {state.models?.debater_con ?? "…"}
          </span>
        </div>
      </div>

      {debateId && <AdvanceBar debateId={debateId} />}

      {state.failed !== null && (
        <div className="failed-banner">debate failed: {state.failed}</div>
      )}

      <div className="m-body">
        {tab === "stage" && <StageFeed />}
        {tab === "facts" && <FactCheckFeed />}
        {tab === "judge" && <JudgeCard />}
        {tab === "events" && <EventsList />}
      </div>

      <nav className="m-tabs">
        {(["stage", "facts", "judge", "events"] as Tab[]).map((name) => (
          <button
            key={name}
            type="button"
            className={`m-tab${tab === name ? " active" : ""}`}
            onClick={() => setTab(name)}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </nav>
    </div>
  );
}
