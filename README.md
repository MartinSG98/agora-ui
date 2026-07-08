# Agora UI

React frontend for [Agora](https://github.com/MartinSG98/agora-backend), a multi-agent debate and evaluation platform. Two LLM debaters argue a motion while a fact-checker verifies their citations and a blind judge scores the transcript. This UI is the control room for that machinery: a live split-view arena fed by the backend's SSE stream, a setup console, and a replay gallery.

The visual direction is called Control Room, a dark ops-console look where the state machine pipeline, the event stream and the evaluation signals are front and center. The full design handoff with tokens and screen specs lives in [docs/design/handoff.md](docs/design/handoff.md), and the pixel reference is [docs/design/debate-arena.dc.html](docs/design/debate-arena.dc.html) (open it in a browser).

Work in progress. The scaffold is up, screens land commit by commit.

## Stack

Vite, React 19, TypeScript and plain CSS built on design-token custom properties. No component library, since the design is fully custom and a library would fight it.

## Run

```bash
npm install
npm run dev
```

The dev server proxies API calls to the backend on `http://127.0.0.1:8000`, so start [agora-backend](https://github.com/MartinSG98/agora-backend) first. Mock mode works fine and costs nothing.
