// Citation chip rendering shared by the desktop panels and the mobile
// transcript feed. "(source: 123, 456)" becomes per-source chips, marked
// ✓ when a fact-check verdict supported that source for the side and ✗
// when it came back fabricated.

import { Fragment, type ReactNode } from "react";
import type { ClaimVerdict, Side } from "../../api/types";

const CITATION = /\(source:\s*([\d\s,]+)\)/g;

export type CitationMark = "ok" | "bad";

export function buildCitationMarks(
  claims: ClaimVerdict[],
  side: Side,
): Map<string, CitationMark> {
  const marks = new Map<string, CitationMark>();
  for (const claim of claims) {
    if (claim.side !== side || !claim.source_id) continue;
    if (claim.verdict === "supported") {
      if (!marks.has(claim.source_id)) marks.set(claim.source_id, "ok");
    } else if (
      claim.verdict === "not_found" ||
      claim.verdict === "source_not_found"
    ) {
      marks.set(claim.source_id, "bad");
    }
  }
  return marks;
}

export function renderStatement(
  text: string,
  side: Side,
  marks: Map<string, CitationMark>,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION)) {
    nodes.push(text.slice(last, match.index));
    const ids = match[1]
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    ids.forEach((id, i) => {
      const mark = marks.get(id);
      nodes.push(
        <Fragment key={`${match.index}-${id}`}>
          {i > 0 && " "}
          <span className={`cite-chip ${side}`}>
            src:{id}
            {mark === "ok" && " ✓"}
            {mark === "bad" && " ✗"}
          </span>
        </Fragment>,
      );
    });
    last = match.index + match[0].length;
  }
  nodes.push(text.slice(last));
  return nodes;
}
