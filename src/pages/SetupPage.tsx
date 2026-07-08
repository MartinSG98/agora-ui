// Placeholder until step 4. Proves the ConfigContext round-trip works.
import { useConfig } from "../context/ConfigContext";

export default function SetupPage() {
  const { models, formats, loading, error } = useConfig();

  return (
    <div className="panel" style={{ padding: 20, maxWidth: 560 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        debate setup · placeholder
      </div>
      {loading && <p style={{ color: "var(--text-secondary)" }}>loading config…</p>}
      {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
      {models && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-body)",
            lineHeight: 1.8,
          }}
        >
          {models.allowed.length} allowed models ·{" "}
          {formats.map((format) => format.name).join(" / ")} formats loaded
        </p>
      )}
    </div>
  );
}
