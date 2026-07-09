// Per-side token/latency stats for the panel footers. Metrics rows exist
// per completed agent call, so a refetch after each turn keeps the
// footers a turn behind at most.

import { useEffect, useState } from "react";
import { getMetrics } from "../../api/client";
import type { Side } from "../../api/types";

export interface SideStats {
  outputTokens: number;
  latencySeconds: number;
}

export type MetricsBySide = Partial<Record<Side, SideStats>>;

export function useMetrics(debateId: string, turnCount: number): MetricsBySide {
  const [bySide, setBySide] = useState<MetricsBySide>({});

  useEffect(() => {
    if (turnCount === 0) return;
    let cancelled = false;
    getMetrics(debateId)
      .then((metrics) => {
        if (cancelled) return;
        const next: MetricsBySide = {};
        for (const side of ["pro", "con"] as Side[]) {
          const runs = metrics.runs.filter(
            (run) => run.agent === `debater_${side}`,
          );
          const latest = runs[runs.length - 1];
          if (latest) {
            next[side] = {
              outputTokens: latest.output_tokens,
              latencySeconds: latest.latency_ms / 1000,
            };
          }
        }
        setBySide(next);
      })
      .catch(() => {
        // footers just keep their previous values
      });
    return () => {
      cancelled = true;
    };
  }, [debateId, turnCount]);

  return bySide;
}
