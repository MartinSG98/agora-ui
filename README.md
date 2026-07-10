# Agora UI

React frontend for [Agora](https://github.com/MartinSG98/agora-backend), a multi-agent debate and evaluation platform where two LLM debaters argue a motion, a fact-checker verifies their citations against real sources, and a blind judge scores the transcript. This UI is the control room for that machinery.

The visual direction is called Control Room, a dark ops-console look where the state machine, the SSE event stream and the evaluation signals are front and center. The full design handoff lives in [docs/design/handoff.md](docs/design/handoff.md) and the pixel reference is [docs/design/debate-arena.dc.html](docs/design/debate-arena.dc.html), which opens in any browser.

## Screens

**Setup console** (`/`). Motion input with live validation, format cards that swap the rules preview (rules come from the backend's rules MCP server), a rebuttal rounds picker with the hard limit noted, a model lineup fed by the registry and cost allowlist, and a position swap toggle. Launching posts to the backend and drops you into the arena.

**Live arena** (`/debates/:id`). The three-column stage. Debater panels stream statements word by word with a block cursor, and citations like `(source: 59602196)` render as chips that get a check mark when the fact-checker verifies them and a cross when they come back fabricated. The center column holds the blind judge card (anonymous participant chips while running, the full verdict with per-category scores after judging), the fact-checker feed and the rubric weights. A phase pipeline tracks the state machine and an event ticker shows the raw stream, with flagged claim verdicts in red. Under 700px the same data renders as the mobile arena: a stacked transcript feed with fact-check interjections and a sticky STAGE / FACTS / JUDGE / EVENTS tab bar.

**Replay gallery** (`/debates`). Every stored debate with its winner badge. Finished debates replay through the arena at zero cost using the backend's stored event log, and the replay is byte-identical to what the live stream produced. Running debates can be joined mid-flight. Position swap evaluations expand inline to show whether the win followed the model or the side.

## How it talks to the backend

The backend emits every debate as an append-only, seq-ordered event log over SSE. One hook (`useDebateStream`) owns the connection and folds events through a pure reducer, and the same consumer handles live streams, mid-flight catch-up and replay, deduped by seq. State lives in two contexts chosen deliberately: app-wide config that loads once, and a per-debate stream scoped to the arena subtree so high-frequency deltas never re-render the rest of the app. The reducer is unit tested with vitest.

API calls go out under `/api` and the dev server proxies them to the backend on port 8000, so page routes and API routes never collide.

## Design decisions

Recorded as ADRs in [docs/adr/](docs/adr/README.md): the committed design handoff as source of truth, plain CSS on design tokens instead of a component library, two contexts and no store library, and the single stream consumer for live and replay.

## Run

```bash
npm install
npm run dev
```

Start [agora-backend](https://github.com/MartinSG98/agora-backend) first on port 8000. Mock mode is its default and costs nothing, and the whole UI works against it, including replays of stored live debates.

```bash
npm test        # reducer unit tests
npm run build   # typecheck + production build
```

## Stack

Vite, React 19, TypeScript, react-router, plain CSS on custom properties, vitest. No component library and no store library, both deliberate (ADRs 0003 and 0004).

## Roadmap

- Results view with a score radar chart
- Leaderboard across stored debates
- Order-bias and multi-judge visualisations as the backend grows them
- Human-vs-agent mode
