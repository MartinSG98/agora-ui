// Center of the stage: the blind judge card (verdict reveal after
// judging), the fact-checker feed, and the rubric weights.

import type { ClaimVerdictValue, Winner } from "../../api/types";
import { useDebate } from "../../stream/DebateStreamContext";

// Mirrors mcp-servers/rules/data/rubric_default.json in the backend repo;
// the judge reads it over MCP, the UI only visualises the weights.
const RUBRIC: [string, number][] = [
  ["argument", 0.25],
  ["evidence", 0.2],
  ["rebuttal", 0.2],
  ["consistency", 0.15],
  ["relevance", 0.1],
  ["compliance", 0.1],
];

const SHORT_CATEGORY: Record<string, string> = {
  argument_quality: "argument",
  evidence_quality: "evidence",
  rebuttal_effectiveness: "rebuttal",
  logical_consistency: "consistency",
  topic_relevance: "relevance",
  rule_compliance: "compliance",
};

const VERDICT_STYLE: Record<
  ClaimVerdictValue,
  { icon: string; label: string; tone: "ok" | "warn" | "bad" }
> = {
  supported: { icon: "✓", label: "verified", tone: "ok" },
  partially_supported: { icon: "⚠", label: "partial", tone: "warn" },
  uncited: { icon: "⚠", label: "uncited", tone: "warn" },
  unverifiable: { icon: "⚠", label: "unverifiable", tone: "warn" },
  not_found: { icon: "✗", label: "fabricated", tone: "bad" },
  source_not_found: { icon: "✗", label: "fabricated", tone: "bad" },
};

function winnerClass(winner: Winner): string {
  return winner === "draw" ? "draw" : winner;
}

export function JudgeCard() {
  const { state } = useDebate();
  const judge = state.judge;

  return (
    <div className="judge-card">
      <div className="label" style={{ marginBottom: 8 }}>
        JUDGE · BLIND
      </div>
      <div className="judge-model">{state.models?.judge ?? "…"}</div>

      {judge === null ? (
        <>
          <div className="participant-chips">
            <span className="participant-chip">participant_x</span>
            <span className="participant-chip">participant_y</span>
          </div>
          <div className="judge-caption">
            random assignment · rubric-locked JSON
          </div>
        </>
      ) : (
        <div className="verdict">
          <div className="label" style={{ margin: "12px 0 6px" }}>
            VERDICT
          </div>
          <div className={`verdict-winner ${winnerClass(judge.winner)}`}>
            {judge.winner === "draw" ? "DRAW" : `${judge.winner} WINS`}
          </div>
          <div className="verdict-confidence">
            confidence {judge.confidence.toFixed(2)}
          </div>
          <div className="score-table">
            {Object.keys(judge.scores.pro).map((category) => (
              <div key={category} className="score-row">
                <span className="cat">{SHORT_CATEGORY[category] ?? category}</span>
                <span className="pro-score">{judge.scores.pro[category]}</span>
                <span className="con-score">{judge.scores.con[category]}</span>
              </div>
            ))}
          </div>
          <div className="verdict-moment">{judge.decisive_moment}</div>
        </div>
      )}
    </div>
  );
}

function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function FactCheckFeed() {
  const { state } = useDebate();
  const model = state.models?.fact_checker ?? "…";
  const verifying = state.phase === "verification";

  return (
    <div className="factcheck-card">
      <div className="card-head" style={{ marginBottom: 10 }}>
        <span className="label">FACT_CHECKER</span>
        <span className="label" style={{ letterSpacing: 0 }}>
          {model}
        </span>
      </div>
      <div className="factcheck-rows">
        {state.claims.map((claim, index) => {
          const style = VERDICT_STYLE[claim.verdict];
          return (
            <div key={index}>
              <span className={`fc-verdict ${style.tone}`}>
                {style.icon} {style.label}
              </span>{" "}
              <span className="fc-detail">
                {truncate(claim.claim, 52)}
                {claim.source_id ? ` → src:${claim.source_id}` : " → no source_id"}
              </span>
            </div>
          );
        })}
        {state.claims.length === 0 && (
          <div className="fc-empty">
            {verifying ? "▸ extracting claims…" : "runs after closing statements"}
          </div>
        )}
      </div>
    </div>
  );
}

function RubricCard() {
  return (
    <div className="rubric-card">
      <div className="label" style={{ marginBottom: 10 }}>
        RUBRIC WEIGHTS
      </div>
      <div className="rubric-rows">
        {RUBRIC.map(([name, weight]) => (
          <div key={name} className="rubric-row">
            <span className="rubric-name">{name}</span>
            <span className="rubric-bar" style={{ width: `${weight * 100}%` }} />
            <span className="rubric-weight">
              {weight.toFixed(2).replace(/^0/, "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CenterColumn() {
  return (
    <div className="center-column">
      <JudgeCard />
      <FactCheckFeed />
      <RubricCard />
    </div>
  );
}
