// Placeholder until steps 5-6 (SSE stream + live arena).
import { useParams } from "react-router-dom";

export default function ArenaPage() {
  const { debateId } = useParams();

  return (
    <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        live arena · placeholder
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-body)" }}>
        debate {debateId}
      </p>
    </div>
  );
}
