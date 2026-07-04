export type AgentStatus = "idle" | "running" | "done" | "error";

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  provider: "google" | "openai" | "anthropic";
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
