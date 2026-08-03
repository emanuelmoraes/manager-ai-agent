export type AgentStatus = "idle" | "running" | "done" | "error";

export type AiProviderId = "google" | "openai" | "anthropic" | "deepseek" | "grok";

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  provider: AiProviderId;
  model: string;
  mcpServers?: string[];
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  updatedAt: number;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}
