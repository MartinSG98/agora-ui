import { describe, expect, it } from "vitest";
import type { AgoraEvent } from "../api/events";
import {
  debateStreamReducer,
  initialStreamState,
  type StreamState,
} from "./debateStreamReducer";

let seq = 0;

function event(partial: Omit<AgoraEvent, "debate_id" | "seq" | "timestamp">) {
  seq += 1;
  return {
    type: "event" as const,
    event: {
      debate_id: "d1",
      seq,
      timestamp: seq,
      ...partial,
    } as AgoraEvent,
  };
}

function run(actions: ReturnType<typeof event>[]): StreamState {
  return actions.reduce(debateStreamReducer, initialStreamState);
}

describe("debateStreamReducer", () => {
  it("folds a full debate into arena state", () => {
    seq = 0;
    const state = run([
      event({
        type: "debate_started",
        payload: {
          topic: "t",
          format: "oxford",
          models: { debater_pro: "nova-lite" },
          rebuttal_rounds: 2,
        },
      }),
      event({ type: "phase_changed", payload: { phase: "opening", round: 0 } }),
      event({
        type: "turn_started",
        payload: { side: "pro", phase: "opening", round: 0 },
      }),
      event({
        type: "evidence_used",
        payload: { side: "pro", tool: "search_sources", arguments: {} },
      }),
      event({ type: "message_delta", payload: { side: "pro", text: "I open" } }),
      event({ type: "message_delta", payload: { side: "pro", text: "in favour." } }),
      event({
        type: "turn_completed",
        payload: {
          side: "pro",
          phase: "opening",
          round: 0,
          content: "I open in favour.",
        },
      }),
    ]);

    expect(state.topic).toBe("t");
    expect(state.phase).toBe("opening");
    expect(state.sides.pro.evidenceCalls).toBe(1);
    expect(state.sides.pro.status).toBe("idle");
    expect(state.sides.pro.streaming).toBe(""); // cleared after completion
    expect(state.turns).toHaveLength(1);
    expect(state.turns[0].content).toBe("I open in favour.");
    expect(state.seq).toBe(7);
  });

  it("assembles streaming buffers with word spacing while generating", () => {
    seq = 0;
    const state = run([
      event({
        type: "turn_started",
        payload: { side: "con", phase: "opening", round: 0 },
      }),
      event({ type: "message_delta", payload: { side: "con", text: "First chunk" } }),
      event({ type: "message_delta", payload: { side: "con", text: "second chunk" } }),
    ]);
    expect(state.sides.con.status).toBe("generating");
    expect(state.sides.con.streaming).toBe("First chunk second chunk");
  });

  it("resets the evidence counter when a new turn starts", () => {
    seq = 0;
    const state = run([
      event({
        type: "turn_started",
        payload: { side: "pro", phase: "opening", round: 0 },
      }),
      event({
        type: "evidence_used",
        payload: { side: "pro", tool: "search_sources", arguments: {} },
      }),
      event({
        type: "evidence_used",
        payload: { side: "pro", tool: "get_source_content", arguments: {} },
      }),
      event({
        type: "turn_completed",
        payload: { side: "pro", phase: "opening", round: 0, content: "x" },
      }),
      event({
        type: "turn_started",
        payload: { side: "pro", phase: "rebuttal", round: 1 },
      }),
    ]);
    expect(state.sides.pro.evidenceCalls).toBe(0); // fresh quota this turn
    expect(state.sides.pro.evidenceTotal).toBe(2); // debate-wide count kept
  });

  it("drops duplicate seq from reconnect history overlap", () => {
    seq = 0;
    const first = event({
      type: "claim_verdict",
      payload: {
        claim: "c",
        side: "pro",
        source_id: "1",
        quote: "q",
        verdict: "supported",
      },
    });
    const state = [first, { ...first }].reduce(
      debateStreamReducer,
      initialStreamState,
    );
    expect(state.claims).toHaveLength(1);
    expect(state.ticker).toHaveLength(1);
  });

  it("flags non-supported claim verdicts in the ticker", () => {
    seq = 0;
    const state = run([
      event({
        type: "claim_verdict",
        payload: {
          claim: "fabricated",
          side: "con",
          source_id: "9",
          quote: "x",
          verdict: "not_found",
        },
      }),
    ]);
    expect(state.ticker[0].flagged).toBe(true);
    expect(state.claims[0].verdict).toBe("not_found");
  });

  it("tracks step-mode pauses until the next event clears them", () => {
    seq = 0;
    const paused = run([
      event({ type: "awaiting_advance", payload: { next: "pro opening" } }),
    ]);
    expect(paused.awaitingAdvance).toBe("pro opening");

    const resumed = [
      event({
        type: "turn_started",
        payload: { side: "pro", phase: "opening", round: 0 },
      }),
    ].reduce(debateStreamReducer, paused);
    expect(resumed.awaitingAdvance).toBeNull();
  });

  it("records judge result and terminal states", () => {
    seq = 0;
    const state = run([
      event({
        type: "judge_result",
        payload: {
          winner: "pro",
          confidence: 0.7,
          scores: { pro: {}, con: {} },
          decisive_moment: "d",
          reasoning_summary: "r",
          unsupported_claims: [],
        },
      }),
      event({ type: "debate_completed", payload: {} }),
    ]);
    expect(state.judge?.winner).toBe("pro");
    expect(state.completed).toBe(true);
    expect(state.phase).toBe("complete"); // COMPLETE pipeline chip lights up
  });
});
