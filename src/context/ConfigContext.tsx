// App-wide backend configuration: model registry, allowlist and debate
// formats. Fetched once at startup and read anywhere via useConfig(), so
// no component ever threads this data through props.

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
  type DebateFormat,
  type ModelsResponse,
} from "../api/client";

interface ConfigState {
  models: ModelsResponse | null;
  formats: DebateFormat[];
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigState | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfigState>({
    models: null,
    formats: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchModels(), fetchFormats()])
      .then(([models, formats]) => {
        if (!cancelled) {
          setState({ models, formats, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({
            models: null,
            formats: [],
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
