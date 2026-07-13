// Pure reducer that folds the SSE event log into arena state. Events are
// append-only and seq-ordered, so state is a deterministic function of the
// log. Duplicates (reconnect replays, history overlap) are dropped by seq,
// which makes live, catch-up and replay identical paths (ADR 0005).

import type { AgoraEvent, JudgeResultPayload } from "../api/events";
import type { ClaimVerdict, DebatePhase, Side } from "../api/types";

export type SideStatus = "idle" | "generating";

export interface SideState {
  status: SideStatus;
  streaming: string;
  evidenceCalls: number; // this turn (backend quota is per phase turn)
  evidenceTotal: number; // whole debate (0 here means "never researched")
}

export interface TickerEntry {
  seq: number;
  type: AgoraEvent["type"];
  flagged: boolean;
}

export interface StreamTurn {
  phase: DebatePhase;
  round: number;
  side: Side;
  content: string;
}

export interface StreamState {
  seq: number;
  connected: boolean;
  topic: string | null;
  format: string | null;
  models: Record<string, string> | null;
  rebuttalRounds: number;
  phase: DebatePhase;
  round: number;
  turns: StreamTurn[];
  sides: Record<Side, SideState>;
  claims: ClaimVerdict[];
  judge: JudgeResultPayload | null;
  completed: boolean;
  failed: string | null;
  ticker: TickerEntry[];
  // step mode: name of the paused unit awaiting POST /advance, else null
  awaitingAdvance: string | null;
}

const TICKER_LIMIT = 80;

const emptySide = (): SideState => ({
  status: "idle",
  streaming: "",
  evidenceCalls: 0,
  evidenceTotal: 0,
});

export const initialStreamState: StreamState = {
  seq: 0,
  connected: false,
  topic: null,
  format: null,
  models: null,
  rebuttalRounds: 0,
  phase: "created",
  round: 0,
  turns: [],
  sides: { pro: emptySide(), con: emptySide() },
  claims: [],
  judge: null,
  completed: false,
  failed: null,
  ticker: [],
  awaitingAdvance: null,
};

export type StreamAction =
  | { type: "event"; event: AgoraEvent }
  | { type: "connected" }
  | { type: "disconnected" };

function withSide(
  state: StreamState,
  side: Side,
  patch: Partial<SideState>,
): Record<Side, SideState> {
  return { ...state.sides, [side]: { ...state.sides[side], ...patch } };
}

function applyEvent(state: StreamState, event: AgoraEvent): StreamState {
  switch (event.type) {
    case "debate_started":
      return {
        ...state,
        topic: event.payload.topic,
        format: event.payload.format,
        models: event.payload.models,
        rebuttalRounds: event.payload.rebuttal_rounds,
      };
    case "phase_changed":
      return {
        ...state,
        phase: event.payload.phase,
        round: event.payload.round,
      };
    case "turn_started":
      // evidenceCalls resets per turn: the backend quota is per phase turn,
      // so the footer shows spend for the statement in progress
      return {
        ...state,
        sides: withSide(state, event.payload.side, {
          status: "generating",
          streaming: "",
          evidenceCalls: 0,
        }),
      };
    case "message_delta": {
      const current = state.sides[event.payload.side].streaming;
      return {
        ...state,
        sides: withSide(state, event.payload.side, {
          streaming: current
            ? `${current} ${event.payload.text}`
            : event.payload.text,
        }),
      };
    }
    case "turn_completed":
      return {
        ...state,
        turns: [
          ...state.turns,
          {
            phase: event.payload.phase,
            round: event.payload.round,
            side: event.payload.side,
            content: event.payload.content,
          },
        ],
        sides: withSide(state, event.payload.side, {
          status: "idle",
          streaming: "",
        }),
      };
    case "evidence_used": {
      const side = event.payload.side;
      return {
        ...state,
        sides: withSide(state, side, {
          evidenceCalls: state.sides[side].evidenceCalls + 1,
          evidenceTotal: state.sides[side].evidenceTotal + 1,
        }),
      };
    }
    case "claim_verdict":
      return { ...state, claims: [...state.claims, event.payload] };
    case "judge_result":
      return { ...state, judge: event.payload };
    case "debate_completed":
      // terminal events carry the phase change implicitly
      return { ...state, completed: true, phase: "complete" };
    case "debate_failed":
      return { ...state, failed: event.payload.error, phase: "failed" };
    default:
      return state;
  }
}

export function debateStreamReducer(
  state: StreamState,
  action: StreamAction,
): StreamState {
  switch (action.type) {
    case "connected":
      return { ...state, connected: true };
    case "disconnected":
      return { ...state, connected: false };
    case "event": {
      const { event } = action;
      if (event.seq <= state.seq) {
        return state; // duplicate from reconnect or history overlap
      }
      const flagged =
        event.type === "claim_verdict" && event.payload.verdict !== "supported";
      const next = applyEvent(state, event);
      return {
        ...next,
        seq: event.seq,
        // a pause holds only until the next event proves the unit ran
        awaitingAdvance:
          event.type === "awaiting_advance" ? event.payload.next : null,
        ticker: [
          ...state.ticker.slice(-(TICKER_LIMIT - 1)),
          { seq: event.seq, type: event.type, flagged },
        ],
      };
    }
  }
}
