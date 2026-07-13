// App-wide backend configuration: model registry, debate formats, runtime
// config (mock mode + hard limits) and the scoring rubric. Fetched once at
// startup and read anywhere via useConfig(), so no component ever threads
// this data through props — and nothing about the backend is hardcoded.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchFormats,
  fetchModels,
  fetchRubric,
  fetchRuntimeConfig,
  type DebateFormat,
  type ModelsResponse,
  type Rubric,
  type RuntimeConfig,
} from "../api/client";

interface ConfigState {
  models: ModelsResponse | null;
  formats: DebateFormat[];
  runtime: RuntimeConfig | null;
  rubric: Rubric | null;
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigState | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfigState>({
    models: null,
    formats: [],
    runtime: null,
    rubric: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchModels(),
      fetchFormats(),
      fetchRuntimeConfig(),
      fetchRubric(),
    ])
      .then(([models, formats, runtime, rubric]) => {
        if (!cancelled) {
          setState({ models, formats, runtime, rubric, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({
            models: null,
            formats: [],
            runtime: null,
            rubric: null,
            loading: false,
            error: `Backend unreachable (${error.message}). Is agora-backend running on :8000?`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): ConfigState {
  const value = useContext(ConfigContext);
  if (value === null) {
    throw new Error("useConfig must be used inside <ConfigProvider>");
  }
  return value;
}
