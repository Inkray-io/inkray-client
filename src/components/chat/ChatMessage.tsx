'use client';

import { forwardRef } from 'react';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SourcesCitation } from './SourcesCitation';
import type { RetrievedSource } from '@/lib/chat/types';
import { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievedSource[];
  isStreaming?: boolean;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  function ChatMessage({ role, content, sources, isStreaming }, ref) {
    const [copied, setCopied] = useState(false);
    const isUser = role === 'user';

    const handleCopy = async () => {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group flex gap-3 px-4 py-4 transition-colors',
          isUser ? 'bg-transparent' : 'bg-slate-50/50'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            isUser
              ? 'bg-gradient-to-br from-[#005EFC] to-[#0047CC] shadow-md shadow-[#005EFC]/20'
              : 'bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200/50'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4 text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-slate-600" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUser ? 'You' : 'Inkray'}
            </span>
            {isStreaming && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#005EFC]" />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#005EFC]"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#005EFC]"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            )}
          </div>

          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-p:leading-relaxed prose-p:text-slate-700',
              'prose-strong:text-slate-800',
              'prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:text-slate-700',
              'prose-pre:bg-slate-900 prose-pre:text-slate-100',
              'prose-a:text-[#005EFC] prose-a:no-underline hover:prose-a:underline',
              isUser && 'prose-p:text-slate-800'
            )}
          >
            <p className="whitespace-pre-wrap">{content}</p>
          </div>

          {/* Sources (only for assistant messages) */}
          {!isUser && sources && <SourcesCitation sources={sources} />}

          {/* Actions (only for assistant messages) */}
          {!isUser && content && !isStreaming && (
            <div className="flex items-center gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
