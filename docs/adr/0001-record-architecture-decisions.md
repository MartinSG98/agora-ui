# ADR 0001: Record architecture decisions

## Status

Accepted

## Context

The backend repo keeps ADRs and they have already paid for themselves in
review conversations. The frontend makes its own set of judgment calls
(styling approach, state architecture, streaming strategy) that deserve
the same treatment.

## Decision

Keep Architecture Decision Records in `docs/adr/`, numbered sequentially,
one decision per file, with Status, Context, Decision and Consequences
sections. Numbering is independent from the backend repo. A superseded
ADR keeps its file and points to its successor.

## Consequences

Design reasoning lives next to the code it explains. Small writing
overhead per significant decision.
