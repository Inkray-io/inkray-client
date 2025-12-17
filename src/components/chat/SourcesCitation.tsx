'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RetrievedSource } from '@/lib/chat/types';

interface SourcesCitationProps {
  sources: RetrievedSource[];
}

/**
 * Process sources: filter negative scores, deduplicate by article, sort by relevance
 */
function processAndDeduplicateSources(sources: RetrievedSource[]): RetrievedSource[] {
  // 1. Filter out negative scores
  const validSources = sources.filter(s => s.score >= 0);

  // 2. Deduplicate by articleSlug (or filename), keeping the highest score
  const byKey = new Map<string, RetrievedSource>();
  for (const source of validSources) {
    const key = source.articleSlug || source.filename;
    const existing = byKey.get(key);
    if (!existing || source.score > existing.score) {
      byKey.set(key, source);
    }
  }

  // 3. Sort by score (highest first) and limit to top 5
  return Array.from(byKey.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function SourcesCitation({ sources }: SourcesCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const processedSources = processAndDeduplicateSources(sources);

  if (processedSources.length === 0) return null;

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
            Sources used ({processedSources.length})
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
            {processedSources.map((source, index) => (
              <SourceCard key={source.articleSlug || index} source={source} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: RetrievedSource; index: number }) {
  // Display article title if available, otherwise fallback to cleaned filename
  const displayTitle = source.articleTitle || cleanFilename(source.filename);
  const hasLink = !!source.articleSlug;

  const cardContent = (
    <>
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-slate-800 group-hover:text-[#005EFC] transition-colors">
          {displayTitle}
        </span>
        {hasLink && (
          <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
        {source.page_content.substring(0, 150)}
        {source.page_content.length > 150 && '...'}
      </p>

      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#005EFC]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  );

  if (hasLink) {
    return (
      <Link
        href={`/article?id=${source.articleSlug}`}
        className="group relative block overflow-hidden rounded-lg border border-slate-200/50 bg-white p-3 transition-all duration-200 hover:border-[#005EFC]/20 hover:shadow-sm"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-slate-200/50 bg-white p-3 transition-all duration-200"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {cardContent}
    </div>
  );
}

/**
 * Clean filename by removing path prefix
 */
function cleanFilename(filename: string): string {
  // Strip path prefix like "inkray-testnet/articles/"
  const match = filename.match(/articles\/(.+)$/);
  if (match) {
    // Remove .md extension if present
    return match[1].replace(/\.md$/, '');
  }
  return filename;
}
