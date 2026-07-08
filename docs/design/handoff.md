# Handoff: Agora — Control Room UI (Debate Arena, Setup, Mobile)

## Overview
Frontend for **Agora** (github.com/MartinSG98/agora-backend) — a multi-agent debate platform. Two LLM debaters argue a motion, a fact-checker verifies citations, a blind judge scores against a weighted rubric. This handoff covers the chosen **"Control Room"** visual direction: a dark ops-console aesthetic where the deterministic state machine, SSE event stream, and evaluation machinery are visually front and center.

Screens included:
1. **Live Debate Arena** (desktop, 1280px) — id `1b` in the design file
2. **Debate Setup** (desktop, 1280px) — id `2a`
3. **Mobile Arena** (390px) — id `2b`

Two rejected style explorations (`1a` warm editorial, `1c` brutalist scoreboard) are also in the design file for reference — ignore them.

## About the Design Files
`Debate Arena.dc.html` is a **design reference created in HTML** — a prototype showing intended look and layout, not production code. All styling is inline on each element, so every value is readable directly from the markup. The task is to **recreate these designs in the target codebase's environment** (the repo roadmap says React) using its patterns — do not ship this HTML. Open the file in a browser to view all screens on one pan/zoom canvas; each screen's wrapper carries a `data-screen-label` attribute (`1b Arena`, `2a Setup`, `2b Mobile Arena`).

## Fidelity
**High-fidelity.** Colors, typography, spacing and copy are final intent. Recreate pixel-perfectly. The sample debate content (statements, claim verdicts, token counts) is illustrative — it must come from the real API.

## Design Tokens

### Colors
- Page background: `#0c0e12`
- Panel background: `#12151b`
- Recessed panel (feeds, tickers): `#0e1116`
- Border: `#1d222c` (1px solid); emphasized border: `#2a3140`
- Text primary: `#e8eaf0`
- Text body (statements): `#c3c9d6`
- Text secondary: `#8892a4`
- Text muted / labels: `#5c6475`
- **Accent (system/brand): `oklch(0.72 0.14 200)`** — cyan; active phase, judge, CTA, selected states. Lighter text variant: `oklch(0.8 0.12 200)`; selected fill: `oklch(0.22 0.04 220)` to `oklch(0.25 0.05 220)`
- **PRO: `oklch(0.78 0.15 150)`** — green; dark fill `oklch(0.2 0.05 150)`
- **CON: `oklch(0.72 0.16 25)`** — red-orange; dark fill `oklch(0.2 0.06 25)`
- Live/verified green: `oklch(0.75 0.16 150)` (dot has glow: `box-shadow: 0 0 8px <same>`)
- Warning/uncited amber: `oklch(0.8 0.12 85)`
- Fabricated red: `oklch(0.68 0.18 25)`

### Typography
- **UI font: 'Archivo'** (Google Fonts) — weights 400–900
- **Data font: 'JetBrains Mono'** (Google Fonts) — all labels, metrics, event names, model names, phase chips
- Label style: 10px JetBrains Mono, `letter-spacing: .16em`, uppercase, color `#5c6475`
- Statement body: 13.5px / 1.65 Archivo, `#c3c9d6`
- Panel titles: 14–15px Archivo 600–700
- Never below 10px

### Geometry
- Panel radius: 6px; inner elements 3–5px; chips/pills 3px
- Panel padding: 14–20px; page gutter: 28px
- Grid (desktop arena): `1fr 350px 1fr`, gap 14px
- Grid (setup): `1fr 380px`, gap 20px
- Role cards use a 3px left border in the role's accent color

## Screens

### 1. Live Debate Arena (`1b`)
- **Header** (border-bottom `#1d222c`): `AGORA_` wordmark (JetBrains Mono 700, underscore in accent cyan) + debate id/format/mode in muted mono, right side SSE status: glowing green dot + `streaming · seq N`.
- **State machine pipeline strip**: chips `OPENING → REBUTTAL 1/2 → CLOSING → VERIFICATION → JUDGING → COMPLETE` joined by `→`. Inactive: `#12151b` bg, `#2a3140` border, muted text. Active: cyan border/text, dark cyan fill, soft cyan glow. Motion text sits right of the pipeline. Phases come from the backend `DebatePhase` enum.
- **Three-column arena**:
  - **PRO panel (left)**: header bar with dark green tint `oklch(0.2 0.04 150)`, `▲ PRO` + model name, status `● generating`. Body: streaming statement with a solid block cursor in PRO green; inline citation chips `src:4821 ✓` (mono, green on dark-green fill). Footer stats row (mono, muted): `tok 412/600 · evidence 2/3 · latency 1.8s` — data from `/debates/{id}/metrics` and `message_delta` events.
  - **CENTER**: Judge card (emphasized `#2a3140` border): `JUDGE · BLIND` label, model name, two dashed-border chips `participant_x` / `participant_y`, caption "random assignment · rubric-locked JSON". Fact-checker feed (recessed bg): rows `✓ verified` (green) / `✗ fabricated` (red) / `⚠ uncited` (amber) + claim → source in muted mono, driven by `claim_verdict` events. Rubric weights card: 6 rows, label + cyan bar sized by weight + weight value (.25/.20/.20/.15/.10/.10).
  - **CON panel (right)**: mirrors PRO with red-orange accents, header tint `oklch(0.2 0.05 25)`, status `idle`. `evidence 0/3` renders in CON red (a signal, not decoration).
- **Event ticker** (bottom, recessed): `seq + event_type` pairs from the SSE stream (`turn_completed`, `evidence_used`, `claim_verdict`, `turn_started`, `message_delta…`). Fabricated-claim seq numbers render red.

### 2. Debate Setup (`2a`)
Maps 1:1 to `POST /debates` (`topic`, `format`, `models`, `rebuttal_rounds`).
- **Header**: wordmark + "new debate"; right side nav (`replay gallery`, `leaderboard`) and a `mock_mode=1` badge.
- **Left column**:
  - **Motion** card: label + char counter `42/300`; input is dark recessed box, 16px text, cyan caret; helper text "min 8 chars · debaters argue pro / con on this exact wording". Validation: 8–300 chars (backend rejects otherwise).
  - **Format** card: two selectable cards — Oxford-style (selected: cyan border + dark-cyan fill + `● selected`) and Casual (muted). Below a divider: **rebuttal rounds** segmented picker `0 / 1 / 2` (selected = cyan) + note "hard limit: 2 — enforced in code, not prompts". Formats come from `GET /formats`.
  - **Model lineup** card: 2×2 grid of dropdown cards, one per role — DEBATER_PRO (green left-border), DEBATER_CON (red), JUDGE · BLIND (cyan), FACT_CHECKER (gray). Options from `GET /models` (registry ∩ allowlist). Caption: "cost allowlist active · ~$0.02/debate live".
  - **Position swap** toggle row: pill toggle + "Also run position swap — same topic, sides exchanged." Maps to `POST /evaluations/position-swap`.
- **Right column**: Rules preview (numbered 01–05, from the selected format's `rules[]`), Hard limits card (mono key/value: max_response_tokens 600, evidence_per_phase 3, tool_loop_iterations 6, judge_retries 1), and the **START DEBATE →** CTA — solid cyan fill, near-black text, 800 weight; caption "mock mode · $0.00 · deterministic replay stored".

### 3. Mobile Arena (`2b`, 390px)
- Compact header (wordmark + LIVE seq); horizontally scrollable phase bar (same chip language, 9.5px); motion block; **versus strip** (`▲ PRO nova-lite` vs `CON ▼ mistral-small`, grid `1fr auto 1fr`).
- **Transcript feed**: stacked turn cards with 3px left border in the speaker's color; active card shows `● generating` + block cursor; queued card at 75% opacity. Fact-check verdicts appear between turns as centered pill interjections.
- **Bottom tab bar**: STAGE / FACTS / JUDGE / EVENTS — active tab has a 2px cyan top border. Tap targets ≥ 44px tall.

## Interactions & Behavior
- **Live updates via SSE** (`GET /debates/{id}/events`): `message_delta` appends streamed text (block cursor visible while generating); `phase_changed` advances the pipeline chip; `claim_verdict` prepends a fact-check row / mobile interjection; `turn_started`/`turn_completed` toggle panel statuses (`● generating` / `idle` / `queued`).
- Replay mode uses the same stream with `?replay=1&delay=0.05` — the UI should be identical live vs replay.
- Setup: format card click swaps the rules preview and default rebuttal rounds; the CTA disables until the motion is ≥8 chars; 422 responses (blocked model, unknown format) surface inline on the offending control.
- Hover states: panels lighten border to `#2a3140`; CTA lightens to `oklch(0.78 0.13 200)`. Keep transitions ≤150ms ease-out — console feel, not bouncy.
- Verdicts/scores are hidden until phase = `judging` completes (blind judging is a product feature; don't leak side names into judge-adjacent UI).

## State Management
- Debate state: id, phase, rebuttal_round, per-side turn list, streaming buffer per active turn, claim verdicts, metrics (tokens/latency/tool calls), seq cursor for SSE dedupe (events are append-only, ordered by `seq`).
- Setup state: topic, format, rebuttal_rounds, models{4 roles}, position_swap flag.
- Server is the source of truth for phase flow — the UI never advances phases itself.

## Assets
None — no images or icon fonts. Glyphs used are plain text: `▲ ▼ ● ✓ ✗ ⚠ → ▸ ▾ ⚖`. Fonts via Google Fonts: Archivo, JetBrains Mono.

## Files
- `Debate Arena.dc.html` — all screens on one canvas. Relevant wrappers: `data-screen-label="1b Arena"`, `"2a Setup"`, `"2b Mobile Arena"`. All styles inline on elements.
