// Replay gallery: every stored debate replays through the arena at zero
// cost (the backend's ADR 0009 demo path), running debates can be joined
// live, and position-swap evaluations reveal their verdicts inline.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getEvaluation,
  listDebates,
  listEvaluations,
} from "../../api/client";
import type {
  DebateSummary,
  Evaluation,
  EvaluationSummary,
} from "../../api/types";
import "./History.css";

const TERMINAL = ["complete", "failed"];

function debateBadge(debate: DebateSummary) {
  if (!TERMINAL.includes(debate.phase)) {
    return <span className="badge running">● {debate.phase}</span>;
  }
  if (debate.phase === "failed") {
    return <span className="badge failed">failed</span>;
  }
  if (debate.winner === "pro" || debate.winner === "con") {
    return <span className={`badge ${debate.winner}`}>{debate.winner} won</span>;
  }
  return <span className="badge">draw</span>;
}

function formatDate(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

function SwapRow({ summary }: { summary: EvaluationSummary }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Evaluation | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && detail === null) {
      try {
        setDetail(await getEvaluation(summary.id));
      } catch {
        // row stays collapsed-looking; nothing useful to show
      }
    }
  }

  const result = detail?.result;

  return (
    <div>
      <button type="button" className="history-row" onClick={toggle}>
        <div>
          <div className="history-topic">{summary.topic}</div>
          <div className="history-meta">
            {summary.id} · position swap · {formatDate(summary.created_at)}
          </div>
        </div>
        <span className={`badge${summary.done ? "" : " running"}`}>
          {summary.done ? "done" : "● running"}
        </span>
      </button>
      {open && result && (
        <div className="swap-detail">
          <div className="swap-verdict">{result.verdict.replace("_", " ")}</div>
          {result.explanation ?? result.error ?? ""}
          <div className="swap-runs">
            {result.runs?.map((run, index) => (
              <Link
                key={run.debate_id}
                className="swap-run-link"
                to={`/debates/${run.debate_id}`}
              >
                run {index + 1}: {run.winner_side ?? "?"}
                {run.winner_model ? ` (${run.winner_model})` : ""} →
              </Link>
            ))}
          </div>
        </div>
      )}
      {open && detail && !result && (
        <div className="swap-detail">still running, check back shortly</div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([listDebates(), listEvaluations()])
      .then(([debateList, evaluationList]) => {
        setDebates(debateList);
        setEvaluations(evaluationList);
      })
      .catch(() => setError("Could not load history. Is the backend up?"));
  }, []);

  if (error) {
    return (
      <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
        <p style={{ color: "var(--bad)", fontSize: 13 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="history">
      <section>
        <span className="label">DEBATES · {debates.length}</span>
        <div className="history-rows">
          {debates.map((debate) => (
            <button
              key={debate.id}
              type="button"
              className="history-row"
              onClick={() => navigate(`/debates/${debate.id}`)}
            >
              <div>
                <div className="history-topic">{debate.topic}</div>
                <div className="history-meta">
                  {debate.id} · {debate.format} · {formatDate(debate.created_at)}
                  {TERMINAL.includes(debate.phase) ? " · replay stored" : ""}
                </div>
              </div>
              {debateBadge(debate)}
            </button>
          ))}
          {debates.length === 0 && (
            <p className="history-empty">
              No debates yet. Start one from the setup page and it will be
              stored here for replay.
            </p>
          )}
        </div>
      </section>

      <section>
        <span className="label">POSITION SWAPS · {evaluations.length}</span>
        <div className="history-rows">
          {evaluations.map((evaluation) => (
            <SwapRow key={evaluation.id} summary={evaluation} />
          ))}
          {evaluations.length === 0 && (
            <p className="history-empty">
              No swap evaluations yet. Toggle position swap on the setup page
              to separate model advantage from position bias.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
