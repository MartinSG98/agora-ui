// Scopes one debate's stream to the arena subtree (ADR 0004): panels,
// phase strip and ticker consume the stream directly instead of receiving
// it through props, and the high-frequency updates never touch the rest
// of the app.

import { createContext, useContext, type ReactNode } from "react";
import { useDebateStream, type DebateStream } from "./useDebateStream";

const DebateStreamContext = createContext<DebateStream | null>(null);

export function DebateStreamProvider({
  debateId,
  children,
}: {
  debateId: string;
  children: ReactNode;
}) {
  const stream = useDebateStream(debateId);
  return (
    <DebateStreamContext.Provider value={stream}>
      {children}
    </DebateStreamContext.Provider>
  );
}

export function useDebate(): DebateStream {
  const value = useContext(DebateStreamContext);
  if (value === null) {
    throw new Error("useDebate must be used inside <DebateStreamProvider>");
  }
  return value;
}
