/**
 * Chat types for assistant-ui integration
 */

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Source from DO Agent's knowledge base
 */
export interface RetrievedSource {
  content: string;
  filename: string;
  score: number;
}

/**
 * Retrieval info from DO Agent response
 */
export interface RetrievalInfo {
  retrieved_data: RetrievedSource[];
}

/**
 * SSE chunk format from backend
 */
export interface ChatChunk {
  content?: string;
  retrieval_info?: RetrievalInfo;
  done?: boolean;
  error?: string;
}

/**
 * Message metadata containing sources
 */
export interface MessageMetadata {
  sources?: RetrievedSource[];
}
