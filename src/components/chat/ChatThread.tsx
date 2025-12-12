'use client';

import { useRef, useEffect } from 'react';
import {
  useThreadRuntime,
  useThread,
  type ThreadMessage,
} from '@assistant-ui/react';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { Sparkles } from 'lucide-react';
import type { RetrievedSource } from '@/lib/chat/types';

export function ChatThread() {
  const threadRuntime = useThreadRuntime();
  const messages = useThread((t) => t.messages);
  const isRunning = useThread((t) => t.isRunning);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    threadRuntime.append({
      role: 'user',
      content: [{ type: 'text', text }],
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((message, index) => (
              <MessageWrapper
                key={message.id}
                message={message}
                isStreaming={isRunning && index === messages.length - 1 && message.role === 'assistant'}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <ChatComposer
        onSend={handleSend}
        isLoading={isRunning}
        showSuggestions={isEmpty}
      />
    </div>
  );
}

function MessageWrapper({
  message,
  isStreaming,
}: {
  message: ThreadMessage;
  isStreaming: boolean;
}) {
  const content = message.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text' && 'text' in c)
    .map((c) => c.text)
    .join('');

  // Extract sources from message metadata if available
  const metadata = message.metadata as { custom?: { sources?: RetrievedSource[] } } | undefined;
  const sources = metadata?.custom?.sources;

  return (
    <ChatMessage
      role={message.role as 'user' | 'assistant'}
      content={content}
      sources={sources}
      isStreaming={isStreaming}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      {/* Logo/Icon */}
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#005EFC]/10 to-[#005EFC]/5">
          <Sparkles className="h-8 w-8 text-[#005EFC]" />
        </div>
        {/* Animated ring */}
        <div className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-[#005EFC]/10 [animation-duration:2s]" />
      </div>

      {/* Text */}
      <h3 className="mb-2 text-lg font-semibold text-slate-800">
        Ask me anything about Inkray
      </h3>
      <p className="max-w-[280px] text-center text-sm leading-relaxed text-slate-500">
        I can help you with creating publications, understanding Walrus storage,
        monetization, and more.
      </p>

      {/* Decorative elements */}
      <div className="mt-8 flex items-center gap-2">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-200" />
        <span className="text-xs text-slate-300">Try a suggestion below</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-200" />
      </div>
    </div>
  );
}
