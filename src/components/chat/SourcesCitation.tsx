'use client';

import { useState } from 'react';
import { ChevronDown, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RetrievedSource } from '@/lib/chat/types';

interface SourcesCitationProps {
  sources: RetrievedSource[];
}

export function SourcesCitation({ sources }: SourcesCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white/90 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#005EFC]/10">
            <FileText className="h-3.5 w-3.5 text-[#005EFC]" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            Sources used ({sources.length})
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-300 ease-out',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 px-4 pb-4">
            {sources.map((source, index) => (
              <SourceCard key={index} source={source} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: RetrievedSource; index: number }) {
  const relevancePercent = Math.round(source.score * 100);
  const relevanceColor =
    relevancePercent >= 80
      ? 'bg-emerald-500'
      : relevancePercent >= 60
        ? 'bg-amber-500'
        : 'bg-slate-400';

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-slate-200/50 bg-white p-3 transition-all duration-200 hover:border-[#005EFC]/20 hover:shadow-sm"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-800">
              {source.filename || 'Document'}
            </span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {source.content.substring(0, 150)}
            {source.content.length > 150 && '...'}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className={cn('h-1.5 w-1.5 rounded-full', relevanceColor)} />
            <span className="text-xs font-medium text-slate-500">
              {relevancePercent}%
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            match
          </span>
        </div>
      </div>

      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#005EFC]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
