// Skeleton placeholder proving the tokens and fonts are wired.
// The real screens (Setup, Arena, Mobile) land in the next commits.
export default function App() {
  return (
    <div style={{ padding: "var(--gutter)" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          AGORA<span style={{ color: "var(--accent)" }}>_</span>
        </span>
        <span className="label">control room · skeleton</span>
      </header>

      <div
        className="panel"
        style={{ marginTop: 20, padding: 20, maxWidth: 480 }}
      >
        <div className="label" style={{ marginBottom: 10 }}>
          status
        </div>
        <p style={{ color: "var(--text-body)", fontSize: 13.5, lineHeight: 1.65 }}>
          UI scaffold online. Design tokens loaded, fonts wired, backend proxy
          configured for <span style={{ fontFamily: "var(--font-mono)" }}>:8000</span>.
        </p>
      </div>
    </div>
  );
}
