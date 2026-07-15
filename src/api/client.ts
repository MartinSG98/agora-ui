// Typed client for the agora-backend API. Calls go out under /api; the
// dev proxy strips the prefix and forwards to :8000 (vite.config.ts), so
// API paths never collide with the SPA's page routes.

import type {
  CreateDebateRequest,
  Debate,
  DebateSummary,
  Evaluation,
  EvaluationSummary,
  Metrics,
} from "./types";

export interface ModelsResponse {
  registry: Record<string, string>;
  defaults: Record<string, string>;
  allowed: string[];
}

export interface DebateFormat {
  name: string;
  display_name: string;
  description: string;
  rebuttal_rounds: number;
  rules: string[];
}

export interface HardLimits {
  max_rebuttal_rounds: number;
  max_response_tokens: number;
  max_evidence_requests_per_phase: number;
  max_tool_loop_iterations: number;
  judge_retries: number;
}

export interface RuntimeConfig {
  mock_mode: boolean;
  limits: HardLimits;
}

export interface Rubric {
  name: string;
  scale: { min: number; max: number };
  categories: Record<string, { weight: number; description: string }>;
}

/** Error carrying the backend's `detail` message, e.g. allowlist rejections. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export const API_PREFIX = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, init);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (body.detail) detail = JSON.stringify(body.detail);
    } catch {
      // non-JSON error body, keep the status text
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// -- config -------------------------------------------------------------------

export function fetchModels(): Promise<ModelsResponse> {
  return request<ModelsResponse>("/models");
}

export async function fetchFormats(): Promise<DebateFormat[]> {
  const data = await request<{ formats: DebateFormat[] }>("/formats");
  return data.formats;
}

export function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  return request<RuntimeConfig>("/config");
}

export function fetchRubric(): Promise<Rubric> {
  return request<Rubric>("/rubric");
}

// -- debates ------------------------------------------------------------------

export function createDebate(body: CreateDebateRequest): Promise<Debate> {
  return post<Debate>("/debates", body);
}

export async function listDebates(): Promise<DebateSummary[]> {
  const data = await request<{ debates: DebateSummary[] }>("/debates");
  return data.debates;
}

export function getDebate(debateId: string): Promise<Debate> {
  return request<Debate>(`/debates/${debateId}`);
}

/** Release the next unit of a step-mode debate. */
export function advanceDebate(debateId: string): Promise<{ advanced: boolean }> {
  return post<{ advanced: boolean }>(`/debates/${debateId}/advance`, {});
}

export function getMetrics(debateId: string): Promise<Metrics> {
  return request<Metrics>(`/debates/${debateId}/metrics`);
}

// -- evaluations --------------------------------------------------------------

export function createPositionSwap(
  body: CreateDebateRequest,
): Promise<Evaluation> {
  return post<Evaluation>("/evaluations/position-swap", body);
}

export async function listEvaluations(): Promise<EvaluationSummary[]> {
  const data = await request<{ evaluations: EvaluationSummary[] }>(
    "/evaluations",
  );
  return data.evaluations;
}

export function getEvaluation(evaluationId: string): Promise<Evaluation> {
  return request<Evaluation>(`/evaluations/${evaluationId}`);
}
