export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  createdAt: TimestampLike;
  parentId?: string;
  chunkIndex?: number;
  embedding?: number[];
}
