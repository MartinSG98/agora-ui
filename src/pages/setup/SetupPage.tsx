// Debate setup console (design screen 2a). Maps 1:1 to POST /debates:
// topic, format, models and rebuttal_rounds, plus the optional position
// swap which posts to /evaluations/position-swap instead. Form state is
// local on purpose (ADR 0004), config comes from useConfig().

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, createDebate, createPositionSwap } from "../../api/client";
import { useConfig } from "../../context/ConfigContext";
import "./SetupPage.css";

const TOPIC_MIN = 8;
const TOPIC_MAX = 300;
const MAX_REBUTTAL_ROUNDS = 2;

// Mirrors HardLimits in the backend's config.py. Display only; the
// backend enforces these regardless of what any client shows.
const HARD_LIMITS: [string, number][] = [
  ["max_response_tokens", 600],
  ["evidence_per_phase", 3],
  ["tool_loop_iterations", 6],
  ["judge_retries", 1],
];

const ROLES: { key: string; label: string; colorVar: string }[] = [
  { key: "debater_pro", label: "▲ DEBATER_PRO", colorVar: "var(--pro)" },
  { key: "debater_con", label: "▼ DEBATER_CON", colorVar: "var(--con)" },
  { key: "judge", label: "JUDGE · BLIND", colorVar: "var(--accent-text)" },
  { key: "fact_checker", label: "FACT_CHECKER", colorVar: "var(--text-secondary)" },
];

export default function SetupPage() {
  const { models, formats, loading, error } = useConfig();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [formatName, setFormatName] = useState<string | null>(null);
  const [rounds, setRounds] = useState(2);
  const [lineup, setLineup] = useState<Record<string, string>>({});
  const [positionSwap, setPositionSwap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seed the form from backend config once it arrives.
  useEffect(() => {
    if (models && formats.length > 0 && formatName === null) {
      const initial = formats.find((f) => f.name === "oxford") ?? formats[0];
      setFormatName(initial.name);
      setRounds(Math.min(initial.rebuttal_rounds, MAX_REBUTTAL_ROUNDS));
      setLineup(models.defaults);
    }
  }, [models, formats, formatName]);

  if (loading) {
    return <div className="label">loading config…</div>;
  }
  if (error || !models) {
    return (
      <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
        <p style={{ color: "var(--bad)", fontSize: 13 }}>{error}</p>
      </div>
    );
  }

  // Oxford is the flagship format, it leads regardless of API order.
  const orderedFormats = [...formats].sort(
    (a, b) => Number(b.name === "oxford") - Number(a.name === "oxford"),
  );
  const selectedFormat = formats.find((f) => f.name === formatName);
  const topicValid =
    topic.trim().length >= TOPIC_MIN && topic.trim().length <= TOPIC_MAX;

  function pickFormat(name: string) {
    setFormatName(name);
    const format = formats.find((f) => f.name === name);
    if (format) {
      setRounds(Math.min(format.rebuttal_rounds, MAX_REBUTTAL_ROUNDS));
    }
  }

  async function launch() {
    if (!topicValid || submitting || !formatName) return;
    setSubmitting(true);
    setSubmitError(null);
    const body = {
      topic: topic.trim(),
      format: formatName,
      models: lineup,
      rebuttal_rounds: rounds,
    };
    try {
      if (positionSwap) {
        const evaluation = await createPositionSwap(body);
        navigate(`/debates/${evaluation.debate_ids[0]}`);
      } else {
        const debate = await createDebate(body);
        navigate(`/debates/${debate.id}`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Request failed. Is the backend up?",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="setup-grid">
      <div className="setup-left">
        {/* motion */}
        <section className="card">
          <div className="card-head">
            <span className="label">THE MOTION</span>
            <span className="label">
              {topic.length}/{TOPIC_MAX}
            </span>
          </div>
          <input
            className="motion-input"
            value={topic}
            maxLength={TOPIC_MAX}
            placeholder="Remote work is better than office work"
            onChange={(event) => setTopic(event.target.value)}
          />
          <div className="motion-help">
            min {TOPIC_MIN} chars · debaters argue pro / con on this exact wording
          </div>
        </section>

        {/* format + rounds */}
        <section className="card">
          <div className="label" style={{ marginBottom: 12 }}>
            FORMAT
          </div>
          <div className="format-grid">
            {orderedFormats.map((format) => {
              const selected = format.name === formatName;
              return (
                <button
                  key={format.name}
                  type="button"
                  className={`format-card${selected ? " selected" : ""}`}
                  onClick={() => pickFormat(format.name)}
                >
                  <div className="format-card-top">
                    <span className="format-name">{format.display_name}</span>
                    {selected && (
                      <span className="format-selected-mark">● selected</span>
                    )}
                  </div>
                  <div className="format-desc">{format.description}</div>
                </button>
              );
            })}
          </div>
          <div className="rounds-row">
            <span className="label" style={{ letterSpacing: "0.14em" }}>
              REBUTTAL ROUNDS
            </span>
            <div className="rounds-options">
              {[0, 1, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`round-btn${rounds === value ? " selected" : ""}`}
                  onClick={() => setRounds(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="rounds-note">
              hard limit: {MAX_REBUTTAL_ROUNDS} — enforced in code, not prompts
            </span>
          </div>
        </section>

        {/* model lineup */}
        <section className="card">
          <div className="card-head" style={{ marginBottom: 14 }}>
            <span className="label">MODEL LINEUP</span>
            <span className="label" style={{ letterSpacing: 0 }}>
              cost allowlist active · ~$0.02/debate live
            </span>
          </div>
          <div className="lineup-grid">
            {ROLES.map((role) => (
              <div
                key={role.key}
                className="role-card"
                style={{ "--role-color": role.colorVar } as React.CSSProperties}
              >
                <label className="role-label" htmlFor={`model-${role.key}`}>
                  {role.label}
                </label>
                <select
                  id={`model-${role.key}`}
                  className="role-select"
                  value={lineup[role.key] ?? ""}
                  onChange={(event) =>
                    setLineup((current) => ({
                      ...current,
                      [role.key]: event.target.value,
                    }))
                  }
                >
                  {models.allowed.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <span className="role-caret">▾</span>
              </div>
            ))}
          </div>
          <div className="swap-row">
            <button
              type="button"
              role="switch"
              aria-checked={positionSwap}
              className={`toggle${positionSwap ? " on" : ""}`}
              onClick={() => setPositionSwap((value) => !value)}
            >
              <span className="knob" />
            </button>
            <span className="swap-text">
              Also run <strong>position swap</strong> — same topic, sides
              exchanged. Separates model advantage from position bias.
            </span>
          </div>
        </section>
      </div>

      <div className="setup-right">
        <section className="rules-card">
          <div className="label" style={{ marginBottom: 12 }}>
            RULES · {selectedFormat?.name.toUpperCase() ?? "—"}
          </div>
          <div className="rules-list">
            {selectedFormat?.rules.map((rule, index) => (
              <div key={rule} className="rule-row">
                <span className="rule-num">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {rule}
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: "18px 20px" }}>
          <div className="label" style={{ marginBottom: 12 }}>
            HARD LIMITS
          </div>
          <div className="limits-list">
            {HARD_LIMITS.map(([key, value]) => (
              <div key={key} className="limit-row">
                <span className="limit-key">{key}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <div>
          <button
            type="button"
            className="launch"
            disabled={!topicValid || submitting}
            onClick={launch}
          >
            {submitting
              ? "STARTING…"
              : positionSwap
                ? "START SWAP PAIR →"
                : "START DEBATE →"}
          </button>
          <div className="launch-caption">
            $0.00 mock · ~$0.02 live · deterministic replay stored
          </div>
          {submitError && <div className="launch-error">{submitError}</div>}
        </div>
      </div>
    </div>
  );
}
