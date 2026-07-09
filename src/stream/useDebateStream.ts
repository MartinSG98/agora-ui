// Owns the SSE connection for one debate and folds every event through
// the reducer. Finished debates get the stored replay, running ones get
// history + live tail; both feed the same consumer (ADR 0005).
//
// EventSource auto-reconnects, and the backend resends history on
// reconnect, so the reducer's seq dedupe makes catch-up idempotent. Once
// the debate reaches a terminal event we close the source ourselves,
// otherwise the browser would reconnect to a finished stream forever.

import { useEffect, useReducer, useRef, useState } from "react";
import { getDebate } from "../api/client";
import { EVENT_TYPES, eventStreamUrl, parseEvent } from "../api/events";
import {
  debateStreamReducer,
  initialStreamState,
  type StreamState,
} from "./debateStreamReducer";

export type StreamMode = "live" | "replay" | "connecting";

const REPLAY_DELAY_SECONDS = 0.04;

export interface DebateStream {
  state: StreamState;
  mode: StreamMode;
}

export function useDebateStream(debateId: string): DebateStream {
  const [state, dispatch] = useReducer(debateStreamReducer, initialStreamState);
  const [mode, setMode] = useState<StreamMode>("connecting");
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function open() {
      // Peek at the debate to pick live vs replay for the same endpoint.
      let finished = false;
      try {
        const debate = await getDebate(debateId);
        finished = debate.phase === "complete" || debate.phase === "failed";
      } catch {
        // 404s surface through the stream erroring below.
      }
      if (cancelled) return;

      setMode(finished ? "replay" : "live");
      const source = new EventSource(
        eventStreamUrl(debateId, {
          replay: finished,
          delay: finished ? REPLAY_DELAY_SECONDS : undefined,
        }),
      );
      sourceRef.current = source;

      source.onopen = () => dispatch({ type: "connected" });
      source.onerror = () => dispatch({ type: "disconnected" });
      for (const type of EVENT_TYPES) {
        source.addEventListener(type, (message) => {
          dispatch({ type: "event", event: parseEvent(message.data) });
        });
      }
    }

    void open();
    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [debateId]);

  // Terminal event seen: the stream is over, stop the auto-reconnect loop.
  const terminal = state.completed || state.failed !== null;
  useEffect(() => {
    if (terminal && sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
      dispatch({ type: "disconnected" });
    }
  }, [terminal]);

  return { state, mode };
}
