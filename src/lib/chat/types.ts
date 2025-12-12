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
 * Note: DO Agent API uses 'page_content' not 'content'
 */
export interface RetrievedSource {
  id?: string;
  page_content: string;
  filename: string;
  score: number;
  data_source_id?: string;
  metadata?: Record<string, unknown>;
  // Enriched from database
  articleTitle?: string;
  articleSlug?: string;
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
