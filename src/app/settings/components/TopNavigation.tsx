import React from "react";
import Link from "next/link";

interface TopNavigationProps {
  activeTab: "keys" | "knowledge" | "mcp";
  setActiveTab: (tab: "keys" | "knowledge" | "mcp") => void;
}

export function TopNavigation({ activeTab, setActiveTab }: TopNavigationProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 md:py-6 border-b border-white/5 gap-4 md:gap-0 shrink-0">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 w-full md:w-auto">
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-50 m-0 shrink-0">
          Configurações
        </h1>
        <nav className="flex gap-6 mt-1 overflow-x-auto whitespace-nowrap w-full pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(
            [
              { id: "keys", label: "Provedores de IA" },
              { id: "knowledge", label: "Base de Conhecimento (RAG)" },
              { id: "mcp", label: "Servidores MCP" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`bg-transparent border-none p-0 pb-2 text-sm cursor-pointer relative transition-colors shrink-0 ${isActive ? 'text-slate-50 font-bold' : 'text-slate-400 font-medium hover:text-slate-300'}`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-violet-400 rounded-t-sm" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4 hidden md:flex shrink-0">
        <Link
          href="/workspace"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 no-underline text-sm font-semibold transition-colors hover:bg-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar ao Workspace
        </Link>
      </div>

      {/* Mobile only actions (just back button, keep it simple) */}
      <div className="flex items-center gap-4 md:hidden w-full mt-2">
        <Link
          href="/workspace"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 no-underline text-sm font-semibold transition-colors hover:bg-white/10 w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar ao Workspace
        </Link>
      </div>
    </header>
  );
}
