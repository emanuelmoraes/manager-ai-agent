import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "Orquestração Inteligente",
    description:
      "Coordena múltiplos agentes de IA em pipelines sequenciais e paralelos, garantindo execução eficiente de tarefas complexas.",
  },
  {
    icon: "⚡",
    title: "Execução em Tempo Real",
    description:
      "Monitore o status de cada agente ao vivo, com feedback imediato e rastreamento completo do fluxo de trabalho.",
  },
  {
    icon: "🔗",
    title: "Integração com Genkit",
    description:
      "Powered by Google Genkit e Gemini Pro, garantindo respostas precisas e capacidade de raciocínio avançado.",
  },
  {
    icon: "🛡️",
    title: "Controle & Governança",
    description:
      "Defina políticas, limites de execução e pontos de revisão humana para manter o controle total dos processos automatizados.",
  },
  {
    icon: "📊",
    title: "Analytics de Agentes",
    description:
      "Visualize métricas de desempenho, histórico de execuções e insights sobre o comportamento de cada agente.",
  },
  {
    icon: "🔄",
    title: "Workflows Adaptativos",
    description:
      "Agentes que aprendem com o contexto e se adaptam dinamicamente às necessidades do projeto em curso.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background noise */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative w-9 h-9">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="17.5" stroke="url(#logo-border)" />
              <circle cx="18" cy="10" r="3" fill="url(#logo-fill)" />
              <circle cx="10" cy="24" r="3" fill="url(#logo-fill)" />
              <circle cx="26" cy="24" r="3" fill="url(#logo-fill)" />
              <line
                x1="18"
                y1="13"
                x2="10"
                y2="21"
                stroke="rgba(167,139,250,0.5)"
                strokeWidth="1.5"
              />
              <line
                x1="18"
                y1="13"
                x2="26"
                y2="21"
                stroke="rgba(167,139,250,0.5)"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="logo-border" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="logo-fill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#e2e8f0",
            }}
          >
            Manager<span style={{ color: "#a78bfa" }}>AI</span>
          </span>
        </div>

        {/* Status indicator */}
        <div className="status-bar hidden sm:flex">
          <div className="status-item">
            <span className="status-dot-green" />
            <span>Sistema Online</span>
          </div>
          <div
            style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }}
          />
          <div className="status-item">
            <span>🤖</span>
            <span>Genkit v1.37</span>
          </div>
          <div
            style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }}
          />
          <div className="status-item">
            <span>⚙️</span>
            <span>Next.js 16</span>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section
        className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden"
        style={{ minHeight: "85vh" }}
      >
        {/* Grid background */}
        <div className="hero-grid" aria-hidden="true" />

        {/* Glow orbs */}
        <div className="glow-orb glow-orb-1" aria-hidden="true" />
        <div className="glow-orb glow-orb-2" aria-hidden="true" />
        <div className="glow-orb glow-orb-3" aria-hidden="true" />

        {/* Floating agent nodes */}
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 56,
            height: 56,
            top: "18%",
            left: "8%",
            animationDelay: "0s",
          }}
          aria-hidden="true"
        >
          🤖
        </div>
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 44,
            height: 44,
            top: "30%",
            left: "14%",
            animationDelay: "1.5s",
            fontSize: 16,
          }}
          aria-hidden="true"
        >
          ⚡
        </div>
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 52,
            height: 52,
            top: "55%",
            left: "6%",
            animationDelay: "3s",
          }}
          aria-hidden="true"
        >
          🧠
        </div>
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 56,
            height: 56,
            top: "18%",
            right: "8%",
            animationDelay: "0.8s",
          }}
          aria-hidden="true"
        >
          📊
        </div>
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 44,
            height: 44,
            top: "40%",
            right: "12%",
            animationDelay: "2s",
            fontSize: 16,
          }}
          aria-hidden="true"
        >
          🔗
        </div>
        <div
          className="agent-node hidden lg:flex"
          style={{
            width: 50,
            height: 50,
            top: "60%",
            right: "7%",
            animationDelay: "4s",
          }}
          aria-hidden="true"
        >
          🛡️
        </div>

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center gap-8"
          style={{ maxWidth: 720 }}
        >
          {/* Badge */}
          <div className="badge animate-fade-up delay-100">
            <span className="badge-dot" />
            Orquestrador de Agentes IA
          </div>

          {/* Title */}
          <h1 className="hero-title animate-fade-up delay-200">
            Gerencie seus{" "}
            <span className="hero-title-accent">Agentes</span>
            <br />
            com Inteligência
          </h1>

          {/* Description */}
          <p className="hero-description animate-fade-up delay-300">
            Uma plataforma centralizada para orquestrar agentes de IA de forma inteligente.
            Crie, monitore e controle pipelines de automação complexos — tudo em um único
            painel, alimentado por <strong style={{ color: "#c4b5fd" }}>Google Genkit</strong>{" "}
            e <strong style={{ color: "#c4b5fd" }}>Gemini Pro</strong>.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up delay-400"
          >
            <Link href="/workspace" className="cta-btn" id="cta-open-workspace">
              Abrir Workspace
              <svg
                className="cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <a href="#features" className="secondary-btn" id="cta-learn-more">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Saiba mais
            </a>
          </div>

          {/* Metrics strip */}
          <div
            className="flex flex-wrap items-center justify-center gap-8 animate-fade-up delay-500"
            style={{ marginTop: 8 }}
          >
            {[
              { value: "∞", label: "Agentes Simultâneos" },
              { value: "< 1s", label: "Latência de Resposta" },
              { value: "100%", label: "Controle Humano" },
            ].map((metric) => (
              <div key={metric.label} className="flex flex-col items-center gap-1">
                <span
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {metric.value}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", letterSpacing: "0.05em" }}>
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 animate-fade-up delay-700"
          style={{ transform: "translateX(-50%)" }}
          aria-hidden="true"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: "#475569",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <span>Scroll</span>
            <div
              style={{
                width: 24,
                height: 40,
                border: "1.5px solid rgba(124,58,237,0.4)",
                borderRadius: 12,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "4px 0",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 8,
                  background: "#a78bfa",
                  borderRadius: 2,
                  animation: "scroll-dot 1.8s ease-in-out infinite",
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes scroll-dot {
              0% { transform: translateY(0); opacity: 1; }
              100% { transform: translateY(16px); opacity: 0; }
            }
          `}</style>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="gradient-divider my-2" aria-hidden="true" />

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          {/* Section header */}
          <div className="flex flex-col items-center text-center mb-16 gap-4">
            <div className="badge">
              <span>🔧</span>
              Capacidades
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#e2e8f0",
                lineHeight: 1.1,
              }}
            >
              Tudo que você precisa para
              <br />
              <span style={{ color: "#a78bfa" }}>orquestrar com precisão</span>
            </h2>
            <p style={{ color: "#64748b", maxWidth: 500, lineHeight: 1.7 }}>
              Cada componente foi pensado para dar a você o controle máximo sobre seus
              agentes, com visibilidade total e zero surpresas.
            </p>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((feature, i) => (
              <article key={feature.title} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
                {/* Decorative corner */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background:
                      i % 2 === 0
                        ? "radial-gradient(circle at 100% 100%, rgba(124,58,237,0.08) 0%, transparent 70%)"
                        : "radial-gradient(circle at 100% 100%, rgba(79,70,229,0.08) 0%, transparent 70%)",
                  }}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="relative z-10 flex flex-col items-center text-center px-6 py-24"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(124,58,237,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col items-center gap-6" style={{ maxWidth: 560 }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#e2e8f0",
              lineHeight: 1.15,
            }}
          >
            Pronto para começar a{" "}
            <span style={{ color: "#a78bfa" }}>orquestrar</span>?
          </h2>
          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            Acesse o workspace e comece a configurar seus agentes agora mesmo.
            Nenhuma configuração extra necessária.
          </p>
          <Link href="/workspace" className="cta-btn" id="cta-final-workspace">
            Iniciar Agora
            <svg
              className="cta-arrow"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          color: "#475569",
          fontSize: "0.8rem",
        }}
      >
        <span>
          © {new Date().getFullYear()} <strong style={{ color: "#a78bfa" }}>ManagerAI</strong>{" "}
          — Orquestrador de Agentes
        </span>
        <span>
          Powered by{" "}
          <span style={{ color: "#c4b5fd" }}>Google Genkit</span> ·{" "}
          <span style={{ color: "#c4b5fd" }}>Gemini Pro</span>
        </span>
      </footer>
    </div>
  );
}
