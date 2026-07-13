// Post-debate results: verdict banner, rubric score radar, judge
// reasoning, flagged claims, per-agent cost and latency, the private
// research notebooks revealed side by side, and an evaluation JSON
// download. Everything comes from the REST detail endpoints — no stream
// needed once a debate is over.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { getDebate, getMetrics } from "../../api/client";
import type { Debate, Metrics, ResearchNote, Side } from "../../api/types";
import { SHORT_CATEGORY } from "../arena/CenterColumn";
import "./Results.css";

const CLAIM_ICON: Record<string, string> = {
  supported: "✓",
  partially_supported: "⚠",
  uncited: "⚠",
  unverifiable: "⚠",
  not_found: "✗",
  source_not_found: "✗",
};

function noteTitle(note: ResearchNote): string {
  const parts = [note.kind.replace("_", " ")];
  if (note.source_id) parts.push(`src:${note.source_id}`);
  if (note.title) parts.push(note.title);
  return parts.join(" · ");
}

function Notebook({ side, notes }: { side: Side; notes: ResearchNote[] }) {
  return (
    <div className={`notebook ${side}`}>
      <div className="label" style={{ marginBottom: 8 }}>
        {side === "pro" ? "▲ PRO" : "▼ CON"} · PRIVATE RESEARCH NOTEBOOK
      </div>
      {notes.map((note) => (
        <div key={note.id} className="note">
          <div className="note-head">{noteTitle(note)}</div>
          <div className="note-content">{note.content}</div>
        </div>
      ))}
      {notes.length === 0 && (
        <p className="notebook-empty">
          no research — this side argued entirely from parametric memory
        </p>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { debateId } = useParams();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debateId) return;
    Promise.all([getDebate(debateId), getMetrics(debateId)])
      .then(([debateDetail, metricsDetail]) => {
        setDebate(debateDetail);
        setMetrics(metricsDetail);
      })
      .catch(() => setError("Could not load this debate."));
  }, [debateId]);

  if (error) {
    return (
      <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
        <p style={{ color: "var(--bad)", fontSize: 13 }}>{error}</p>
      </div>
    );
  }
  if (!debate || !metrics) {
    return <div className="label">loading results…</div>;
  }

  const result = debate.result;
  if (!result) {
    return (
      <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          This debate has no verdict yet.{" "}
          <Link to={`/debates/${debate.id}`} style={{ color: "var(--accent-text)" }}>
            Watch it in the arena →
          </Link>
        </p>
      </div>
    );
  }

  const radarData = Object.keys(result.scores.pro).map((category) => ({
    category: SHORT_CATEGORY[category] ?? category,
    pro: result.scores.pro[category],
    con: result.scores.con[category],
  }));

  const flagged = result.claim_verdicts.filter(
    (claim) => claim.verdict !== "supported",
  );

  function downloadEvaluation() {
    if (!debate || !metrics) return;
    const payload = {
      id: debate.id,
      topic: debate.topic,
      format: debate.format,
      models: debate.models,
      result: debate.result,
      metrics,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agora-${debate.id}-evaluation.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="results">
      <div className="results-banner">
        <div>
          <div className="results-motion">“{debate.topic}”</div>
          <div className="results-matchup">
            ▲ {debate.models.debater_pro} vs {debate.models.debater_con} ▼ ·
            judged blind by {debate.models.judge} · {debate.format}
          </div>
        </div>
        <div>
          <div className={`results-winner ${result.winner}`}>
            {result.winner === "draw" ? "DRAW" : `${result.winner} WINS`}
          </div>
          <div className="results-confidence">
            confidence {result.confidence.toFixed(2)} · judge attempts{" "}
            {result.judge_attempts}
          </div>
        </div>
        <div className="results-actions">
          <Link className="results-btn" to={`/debates/${debate.id}`}>
            ▶ replay
          </Link>
          <button type="button" className="results-btn" onClick={downloadEvaluation}>
            ↓ evaluation JSON
          </button>
        </div>
      </div>

      <div className="results-grid">
        <div className="results-card">
          <div className="label" style={{ marginBottom: 6 }}>
            RUBRIC SCORES
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--border-strong)" />
              <PolarAngleAxis
                dataKey="category"
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                name="pro"
                dataKey="pro"
                stroke="var(--pro)"
                fill="var(--pro)"
                fillOpacity={0.22}
              />
              <Radar
                name="con"
                dataKey="con"
                stroke="var(--con)"
                fill="var(--con)"
                fillOpacity={0.22}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="radar-legend">
            <span className="pro">▲ pro · {debate.models.debater_pro}</span>
            <span className="con">▼ con · {debate.models.debater_con}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="results-card">
            <div className="label" style={{ marginBottom: 8 }}>
              DECISIVE MOMENT
            </div>
            <p className="reasoning-block">{result.decisive_moment}</p>
            <div className="label" style={{ margin: "14px 0 8px" }}>
              JUDGE REASONING
            </div>
            <p className="reasoning-block">{result.reasoning_summary}</p>
          </div>

          <div className="results-card">
            <div className="label" style={{ marginBottom: 10 }}>
              FLAGGED CLAIMS · {flagged.length} of {result.claim_verdicts.length}
            </div>
            <div className="claims-rows">
              {flagged.map((claim, index) => (
                <div key={index}>
                  <span
                    className={`fc-verdict ${
                      claim.verdict.includes("found") ? "bad" : "warn"
                    }`}
                  >
                    {CLAIM_ICON[claim.verdict]} {claim.verdict}
                  </span>{" "}
                  <span className="fc-detail">
                    ({claim.side}) {claim.claim}
                    {claim.source_id ? ` → src:${claim.source_id}` : ""}
                  </span>
                </div>
              ))}
              {flagged.length === 0 && (
                <span className="fc-detail">
                  every checked claim was supported
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="results-card">
        <div className="label" style={{ marginBottom: 10 }}>
          AGENT METRICS
        </div>
        <table className="metrics-table">
          <thead>
            <tr>
              <th>AGENT</th>
              <th>MODEL</th>
              <th>PHASE</th>
              <th>TOK IN</th>
              <th>TOK OUT</th>
              <th>LATENCY</th>
              <th>TOOLS</th>
            </tr>
          </thead>
          <tbody>
            {metrics.runs.map((run) => (
              <tr key={run.id}>
                <td>{run.agent}</td>
                <td>{run.model_id.split(".").pop()}</td>
                <td>{run.phase}</td>
                <td>{run.input_tokens}</td>
                <td>{run.output_tokens}</td>
                <td>{(run.latency_ms / 1000).toFixed(1)}s</td>
                <td>{run.tool_calls}</td>
              </tr>
            ))}
            <tr className="totals">
              <td>totals</td>
              <td />
              <td />
              <td>{metrics.totals.input_tokens}</td>
              <td>{metrics.totals.output_tokens}</td>
              <td>{(metrics.totals.latency_ms / 1000).toFixed(1)}s</td>
              <td>{metrics.totals.tool_calls}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <div className="label" style={{ margin: "6px 0 10px" }}>
          PRIVATE RESEARCH NOTEBOOKS · REVEALED POST-DEBATE
        </div>
        <div className="notebooks">
          <Notebook side="pro" notes={debate.research_notes.pro} />
          <Notebook side="con" notes={debate.research_notes.con} />
        </div>
      </div>
    </div>
  );
}
