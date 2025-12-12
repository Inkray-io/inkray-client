'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRandomPrompts } from '@/lib/chat/suggested-prompts';

interface ChatComposerProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  showSuggestions?: boolean;
}

export function ChatComposer({
  onSend,
  isLoading = false,
  showSuggestions = false,
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [suggestions] = useState(() => getRandomPrompts(3));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
      {/* Suggested Prompts */}
      {showSuggestions && !message && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.prompt)}
              className="group flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-[#005EFC]/30 hover:bg-[#005EFC]/5 hover:text-[#005EFC] hover:shadow"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <span className="h-1 w-1 rounded-full bg-[#005EFC]/40 transition-colors group-hover:bg-[#005EFC]" />
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div
          className={cn(
            'relative flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-sm transition-all duration-200',
            message
              ? 'border-[#005EFC]/30 ring-2 ring-[#005EFC]/10'
              : 'border-slate-200/60 hover:border-slate-300'
          )}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Inkray..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400',
              isLoading && 'opacity-50'
            )}
          />

          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
              message.trim() && !isLoading
                ? 'bg-gradient-to-br from-[#005EFC] to-[#0047CC] text-white shadow-lg shadow-[#005EFC]/25 hover:shadow-xl hover:shadow-[#005EFC]/30 active:scale-95'
                : 'bg-slate-100 text-slate-400'
            )}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
