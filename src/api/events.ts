// The backend's SSE event vocabulary as a discriminated union. Each event
// arrives as `event: <type>` + `data: <json>` and carries debate_id, seq
// and a typed payload. Events are append-only and ordered by seq, which
// is what makes dedupe and replay trivial (ADR 0005).

import { API_PREFIX } from "./client";
import type { ClaimVerdict, DebatePhase, Side, Winner } from "./types";

export interface JudgeResultPayload {
  winner: Winner;
  confidence: number;
  scores: Record<Side, Record<string, number>>;
  decisive_moment: string;
  reasoning_summary: string;
  unsupported_claims: ClaimVerdict[];
}

export type EventPayloads = {
  debate_started: {
    topic: string;
    format: string;
    models: Record<string, string>;
    rebuttal_rounds: number;
  };
  awaiting_advance: { next: string };
  phase_changed: { phase: DebatePhase; round: number };
  turn_started: { side: Side; phase: DebatePhase; round: number };
  message_delta: { side: Side; text: string };
  turn_completed: {
    side: Side;
    phase: DebatePhase;
    round: number;
    content: string;
  };
  evidence_used: { side: Side; tool: string; arguments: Record<string, unknown> };
  claim_verdict: ClaimVerdict;
  judge_result: JudgeResultPayload;
  debate_completed: Record<string, never>;
  debate_failed: { error: string };
};

export type EventType = keyof EventPayloads;

export type AgoraEvent = {
  [T in EventType]: {
    debate_id: string;
    seq: number;
    type: T;
    payload: EventPayloads[T];
    timestamp: number;
  };
}[EventType];

export const EVENT_TYPES: EventType[] = [
  "debate_started",
  "awaiting_advance",
  "phase_changed",
  "turn_started",
  "message_delta",
  "turn_completed",
  "evidence_used",
  "claim_verdict",
  "judge_result",
  "debate_completed",
  "debate_failed",
];

export function eventStreamUrl(
  debateId: string,
  options: { replay?: boolean; delay?: number } = {},
): string {
  const params = new URLSearchParams();
  if (options.replay) params.set("replay", "1");
  if (options.delay !== undefined) params.set("delay", String(options.delay));
  const query = params.toString();
  return `${API_PREFIX}/debates/${debateId}/events${query ? `?${query}` : ""}`;
}

export function parseEvent(data: string): AgoraEvent {
  return JSON.parse(data) as AgoraEvent;
}
