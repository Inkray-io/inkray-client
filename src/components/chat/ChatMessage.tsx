'use client';

import { forwardRef, useState } from 'react';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { SourcesCitation } from './SourcesCitation';
import type { RetrievedSource } from '@/lib/chat/types';

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
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto mb-2 text-sm">
                      {children}
                    </pre>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-[#005EFC] hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-slate-300 pl-3 italic text-slate-600 mb-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
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
