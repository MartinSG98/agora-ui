# ADR 0003: Plain CSS on design tokens, no component library

## Status

Accepted

## Context

Mantine was on the table, and it is used in the owner's other projects.
But the Control Room design is fully custom: its own palette in oklch,
its own typography, console-style panels and chips that match nothing in
any component library's default look. An audit of the three screens
found only a handful of components that would genuinely benefit from a
library: four dropdowns, one segmented picker and one toggle.

## Decision

No component library. Components are hand-built React styled with plain
CSS against the token custom properties. The dropdowns use styled native
select elements, which bring OS-level keyboard support and accessibility
for free. The picker and toggle are small custom builds.

If a genuinely hard widget appears later (for example a searchable
combobox), adding a headless or component library then is a contained
change, not a rewrite.

## Consequences

Pixel fidelity to the handoff without fighting a theme layer, and a
leaner bundle. The cost is owning a few form controls ourselves, which
the audit says is cheap. Native select popups look like the OS rather
than the console theme, an accepted trade for free accessibility.
