export interface Conversation {
  id: number;
  userId: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  sourceId?: string;
  title: string;
  url?: string;
  spaceKey?: string;
  heading?: string;
  sourceType: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[] | null;
  createdAt: string;
}

export interface IndexingStatus {
  isIndexing: boolean;
  lastIndexedAt: string | null;
  error: string | null;
  pgvectorAvailable: boolean;
  totalChunks: number;
  totalSources: number;
}

export interface ConfluenceSpace {
  key: string;
  name: string;
}

export interface IndexedDocument {
  id: number;
  name: string;
  sourceType: string;
  chunkCount: number;
  createdAt: string;
}

export interface RagBot {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  createdAt: string;
  documentCount: number;
  chunkCount: number;
}

export interface CreateBotPayload {
  name: string;
  description?: string;
}

export interface UpdateBotPayload {
  name?: string;
  description?: string;
}

export interface PublicBotInfo {
  uuid: string;
  name: string;
  description: string | null;
}

export type StreamEvent =
  | { type: 'sources'; sources: Source[] }
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'conversationId'; id: number };
