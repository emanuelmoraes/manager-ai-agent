import React from "react";
import {
  FiCpu,
  FiCode,
  FiFeather,
  FiSend,
  FiBarChart2,
  FiSearch,
  FiEdit3,
  FiShield,
  FiKey,
} from "react-icons/fi";

export const AGENT_ICONS = [
  { id: "bot", label: "Bot", icon: FiCpu },
  { id: "code", label: "Código", icon: FiCode },
  { id: "palette", label: "Design", icon: FiFeather },
  { id: "rocket", label: "Lançamento", icon: FiSend },
  { id: "chart", label: "Analytics", icon: FiBarChart2 },
  { id: "search", label: "Pesquisa", icon: FiSearch },
  { id: "edit", label: "Conteúdo", icon: FiEdit3 },
  { id: "shield", label: "Segurança", icon: FiShield },
  { id: "key", label: "Acesso", icon: FiKey },
] as const;

export type AgentIconId = (typeof AGENT_ICONS)[number]["id"];

interface AgentIconProps {
  icon?: string;
  size?: number | string;
  className?: string;
}

export function AgentIcon({ icon, size = 18, className }: AgentIconProps) {
  const match = AGENT_ICONS.find((item) => item.id === icon);
  const IconComponent = match ? match.icon : FiCpu;
  return <IconComponent size={size} className={className} />;
}
