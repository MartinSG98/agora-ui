# ADR 0004: Two deliberate contexts, local state elsewhere, no store library

## Status

Accepted

## Context

The requirement is close to zero prop drilling. The tempting extremes
are a global store library (Redux, Zustand) or wrapping everything in
context. Neither fits the actual state in this app. There are exactly
two pieces of cross-cutting state: backend configuration that loads once
and never changes, and the live debate stream that updates many times a
second while a debate runs. Everything else, mainly the setup form, is
ordinary component state.

## Decision

Two contexts, each matched to how its data behaves:

- `ConfigContext` wraps the whole app. It fetches `/models` and
  `/formats` once at startup and any component reads them through
  `useConfig()`.
- `DebateStreamContext` wraps only the arena view. A `useDebateStream`
  hook owns the SSE connection and a reducer holding phase, turns,
  streaming buffers, claim verdicts and metrics. Panels, the phase strip
  and the event ticker consume it directly.

The setup form keeps plain `useState`. No store library.

## Consequences

No prop drilling anywhere that matters, and no dependency to justify.
Scoping the stream context to the arena keeps high-frequency SSE updates
from re-rendering the rest of the app. If state ever grows genuinely
global and interdependent, a store library can be introduced behind the
same hook signatures.
