# ADR 0002: The committed design handoff is the source of truth

## Status

Accepted

## Context

The visual direction (Control Room) was designed outside this repo and
delivered as a handoff package: a spec with exact tokens and screen
descriptions, plus an HTML prototype with all styling inline. Without a
canonical copy in the repo, the design and the implementation drift
apart and nobody can tell which one is right.

## Decision

The handoff lives in `docs/design/` (`handoff.md` and
`debate-arena.dc.html`) and is treated as the source of truth for look
and layout. The prototype HTML is a reference to read values from, never
code to ship. Design tokens from the handoff are transcribed once into
`src/styles/tokens.css` and components only ever use the custom
properties, so a token correction is a one-file change.

## Consequences

Anyone can open the prototype in a browser and compare it against the
running app. Deviations from the handoff are deliberate and should be
noted in the relevant ADR or commit message.
