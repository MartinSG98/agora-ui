// Typed client for the agora-backend API. The dev server proxies these
// paths to :8000 (vite.config.ts), so all calls are same-origin relative.

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

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchModels(): Promise<ModelsResponse> {
  return get<ModelsResponse>("/models");
}

export async function fetchFormats(): Promise<DebateFormat[]> {
  const data = await get<{ formats: DebateFormat[] }>("/formats");
  return data.formats;
}
