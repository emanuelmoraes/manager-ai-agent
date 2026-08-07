export type WorkflowNodeType = 'start' | 'agent' | 'parallel' | 'synthesizer' | 'condition' | 'loop' | 'end';

export interface WorkflowNodeData {
  label: string;
  type: WorkflowNodeType;
  agentId?: string;
  model?: string;
  prompt?: string;
  conditionExpr?: string;
  maxIterations?: number;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type WorkflowExecutionStatus = 'idle' | 'running' | 'done' | 'error';

export interface WorkflowLogChunk {
  nodeId?: string;
  agentId?: string;
  status?: 'running' | 'done' | 'error';
  log?: {
    message: string;
    type: 'info' | 'success' | 'system' | 'warning' | 'error';
  };
  output?: any;
}
