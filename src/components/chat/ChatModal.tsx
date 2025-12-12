'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ChatThread } from './ChatThread';

export function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Check if user has interacted before (for pulse animation)
  useEffect(() => {
    const hasUsedChat = localStorage.getItem('inkray-chat-used');
    if (hasUsedChat) {
      setHasInteracted(true);
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasInteracted) {
      localStorage.setItem('inkray-chat-used', 'true');
      setHasInteracted(true);
    }
  };

  // Don't render while loading auth state
  if (isLoading) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ease-out',
          'bg-gradient-to-br from-[#005EFC] to-[#0047CC]',
          'hover:scale-110 hover:shadow-[0_8px_30px_rgb(0,94,252,0.4)]',
          'active:scale-95',
          isOpen && 'pointer-events-none scale-0 opacity-0'
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6 text-white" />

        {/* Pulse animation for first-time users */}
        {!hasInteracted && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-[#005EFC]/50 [animation-duration:1.5s]" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#005EFC] shadow-sm">
              ?
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-out',
          'w-[400px] max-w-[calc(100vw-48px)]',
          'ring-1 ring-slate-200/50',
          isOpen
            ? 'h-[600px] max-h-[calc(100vh-48px)] scale-100 opacity-100'
            : 'pointer-events-none h-0 scale-95 opacity-0'
        )}
        style={{
          transformOrigin: 'bottom right',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23005EFC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#005EFC]/10 to-[#005EFC]/5">
              <MessageCircle className="h-4 w-4 text-[#005EFC]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Inkray Assistant</h2>
              <p className="text-xs text-slate-400">Ask me anything</p>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Minimize chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Content - ChatProvider is at layout level, just render UI */}
        <div className="flex-1 overflow-hidden">
          {isOpen && isAuthenticated ? (
            <ChatThread />
          ) : isOpen && !isAuthenticated ? (
            <NotAuthenticatedState />
          ) : null}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function NotAuthenticatedState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <MessageCircle className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800">Sign in to chat</h3>
      <p className="max-w-[240px] text-sm leading-relaxed text-slate-500">
        Connect your wallet to ask questions about Inkray and get personalized help.
      </p>
    </div>
  );
}
