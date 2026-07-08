# ADR 0005: SSE consumption with identical live and replay paths

## Status

Accepted

## Context

The backend streams debates as an append-only, seq-ordered event log
over SSE, and can replay a stored debate through the exact same endpoint
with `?replay=1`. The frontend could have treated live and replay as
different features with different code paths, or polled REST instead of
streaming.

## Decision

One stream consumer for both modes. `useDebateStream` opens
`GET /debates/{id}/events` (with replay parameters when the debate is
already finished), dedupes on `seq`, and feeds every event through the
same reducer regardless of mode. The server is the only authority on
phase flow. The UI never advances a phase itself, it only renders what
the events say.

## Consequences

Replay is not a feature we build, it falls out for free, and the free
public demo path from the backend's ADR 0009 works in the UI by
construction. Reconnect logic stays simple because the seq cursor makes
catch-up idempotent. The one cost is that anything shown in the UI must
be derivable from events plus REST detail fetches, which keeps the
backend honest about its event vocabulary.
