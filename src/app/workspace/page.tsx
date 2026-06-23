import Link from "next/link";

export const metadata = {
  title: "Workspace — Manager AI Agent",
  description: "Painel de controle e orquestração de agentes de IA.",
};

export default function WorkspacePage() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.15) 0%, #03020a 60%)",
      }}
    >
      {/* Grid bg */}
      <div className="hero-grid" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center gap-8" style={{ maxWidth: 600 }}>
        {/* Under construction badge */}
        <div className="badge">
          <span className="badge-dot" />
          Em Desenvolvimento
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.1,
          }}
        >
          Workspace
        </h1>

        <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: "1.1rem" }}>
          A área de trabalho principal está sendo construída. Em breve você poderá criar,
          configurar e monitorar seus agentes de IA diretamente aqui.
        </p>

        {/* Placeholder agent grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {["🤖", "⚡", "🧠", "🔗", "📊", "🛡️"].map((icon, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1",
                fontSize: 28,
                padding: 0,
                opacity: 0.5,
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        <Link href="/" className="secondary-btn" id="workspace-back-home">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M5 12L11 6M5 12L11 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
