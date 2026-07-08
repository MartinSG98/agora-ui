// Domain types mirroring agora-backend's JSON shapes. If the backend
// changes a shape, this file is the single place the frontend notices.

export type Side = "pro" | "con";

export type DebatePhase =
  | "created"
  | "opening"
  | "rebuttal"
  | "closing"
  | "verification"
  | "judging"
  | "complete"
  | "failed";

export type Winner = Side | "draw";

export type ClaimVerdictValue =
  | "supported"
  | "partially_supported"
  | "not_found"
  | "source_not_found"
  | "uncited"
  | "unverifiable";

export interface ClaimVerdict {
  claim: string;
  side: Side | null;
  source_id: string | null;
  quote: string | null;
  verdict: ClaimVerdictValue;
}

export type RubricScores = Record<string, number>;

export interface DebateResult {
  winner: Winner;
  confidence: number;
  scores: Record<Side, RubricScores>;
  decisive_moment: string;
  reasoning_summary: string;
  blind_mapping: Record<Side, string>;
  claim_verdicts: ClaimVerdict[];
  unsupported_claims: ClaimVerdict[];
  judge_attempts: number;
}

export interface Turn {
  id: number;
  debate_id: string;
  phase: DebatePhase;
  round: number;
  side: Side;
  content: string;
  created_at: number;
}

export interface ResearchNote {
  id: number;
  debate_id: string;
  side: Side;
  kind: "search_results" | "source_content" | "quote_check";
  source_id: string | null;
  title: string | null;
  content: string;
  created_at: number;
}

export interface DebateSummary {
  id: string;
  topic: string;
  format: string;
  phase: DebatePhase;
  winner: Winner | null;
  created_at: number;
  completed_at: number | null;
}

export interface Debate extends DebateSummary {
  rebuttal_rounds: number;
  models: Record<string, string>;
  result: DebateResult | null;
  turns: Turn[];
  research_notes: Record<Side, ResearchNote[]>;
}

export interface AgentRun {
  id: number;
  debate_id: string;
  agent: string;
  phase: DebatePhase;
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  tool_calls: number;
  created_at: number;
}

export interface Metrics {
  runs: AgentRun[];
  totals: {
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    tool_calls: number;
  };
}

export interface CreateDebateRequest {
  topic: string;
  format?: string;
  models?: Record<string, string>;
  rebuttal_rounds?: number;
}

export interface PositionSwapRun {
  debate_id: string;
  winner_side: Winner | null;
  winner_model: string | null;
  confidence: number | null;
}

export interface PositionSwapResult {
  verdict: "model_advantage" | "position_bias" | "inconclusive" | "failed";
  runs: PositionSwapRun[];
  advantaged_model?: string;
  biased_side?: Side;
  explanation?: string;
  error?: string;
}

export interface EvaluationSummary {
  id: string;
  kind: string;
  topic: string;
  done: boolean;
  created_at: number;
}

export interface Evaluation {
  id: string;
  kind: string;
  topic: string;
  debate_ids: string[];
  result: PositionSwapResult | null;
  created_at: number;
  debates?: Debate[];
}
