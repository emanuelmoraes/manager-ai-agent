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
        <button className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center hover:text-slate-300 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        <button className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center hover:text-slate-300 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
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
