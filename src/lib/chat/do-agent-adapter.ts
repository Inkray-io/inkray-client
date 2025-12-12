/**
 * DO Agent adapter for assistant-ui
 * Implements ChatModelAdapter to proxy chat requests through backend
 */

import Cookies from 'js-cookie';
import { CONFIG } from '@/lib/config';
import { ChatMessage, ChatChunk, RetrievedSource } from './types';
import type { ChatModelAdapter, ChatModelRunOptions } from '@assistant-ui/react';

/**
 * Parse SSE data from stream
 */
function parseSSELine(line: string): ChatChunk | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (!data || data === '[DONE]') return null;

  try {
    return JSON.parse(data) as ChatChunk;
  } catch {
    return null;
  }
}

/**
 * Chat model adapter for DO Agent via backend proxy
 * Defined as a module-level constant per assistant-ui docs pattern
 */
export const DoAgentAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const token = Cookies.get('access_token');

      if (!token) {
        yield {
          content: [{ type: 'text' as const, text: 'Please sign in to use the chat feature.' }],
        };
        return;
      }

      // Convert assistant-ui messages to our format
      const chatMessages: ChatMessage[] = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join(''),
      }));

      try {
        const response = await fetch(`${CONFIG.API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: chatMessages }),
          signal: abortSignal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let sources: RetrievedSource[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const chunk = parseSSELine(line);
            if (!chunk) continue;

            if (chunk.content) {
              fullText += chunk.content;
            }

            if (chunk.retrieval_info?.retrieved_data) {
              console.log('[DEBUG] Received sources from backend:', chunk.retrieval_info.retrieved_data);
              sources = chunk.retrieval_info.retrieved_data;
            }

            if (chunk.error) {
              throw new Error(chunk.error);
            }

            // Yield current state
            yield {
              content: [{ type: 'text' as const, text: fullText }],
              // Store sources in metadata for rendering
              ...(sources.length > 0 && {
                metadata: { custom: { sources } },
              }),
            };
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const chunk = parseSSELine(buffer);
          if (chunk?.content) {
            fullText += chunk.content;
          }
          if (chunk?.retrieval_info?.retrieved_data) {
            console.log('[DEBUG] Received sources from buffer:', chunk.retrieval_info.retrieved_data);
            sources = chunk.retrieval_info.retrieved_data;
          }
        }

        // Final yield with complete content
        console.log('[DEBUG] Final yield - sources count:', sources.length);
        yield {
          content: [{ type: 'text' as const, text: fullText }],
          ...(sources.length > 0 && {
            metadata: { custom: { sources } },
          }),
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage = error instanceof Error
          ? error.message
          : 'An error occurred while processing your request.';

        yield {
          content: [{ type: 'text' as const, text: `Error: ${errorMessage}` }],
        };
      }
    },
  };
