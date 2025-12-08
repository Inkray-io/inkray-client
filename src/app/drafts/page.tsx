'use client';
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/layout";
import { useDrafts } from "@/hooks";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw, Image } from "lucide-react";
import React from "react";
import type { DraftArticle } from '@/types/article';
import { CONFIG } from "@/lib/config";
import Link from 'next/link';
import { getPlainTextFromMarkdown } from "@/lib/utils/markdown";


function DraftListItem({ draft }: { draft: DraftArticle }) {
  const title = draft.title || 'Untitled Draft';
  const date = draft.updatedAt || draft.createdAt || '';
  const image = draft.images && draft.images.length > 0 ? draft.images[0] : null;

  // Friendly date formatting
  const formattedDate = date ? new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';

  // Simple excerpt: strip HTML tags and trim
  // const excerpt = (() => {
  //   try {
  //     const plain = getPlainTextFromMarkdown(draft.content);
  //     const trimmed = plain.trim().slice(0, 140);
  //     return trimmed.length < plain.trim().length ? trimmed + '…' : trimmed || 'No content yet';
  //   } catch {
  //     return 'No content yet';
  //   }
  // })();

  const editUrl = `/create?draft-id=${encodeURIComponent(draft.id)}`;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 flex gap-4 items-start">
      <div className="w-28 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${CONFIG.API_URL}/articles/draft/${draft.id}/media/${image.mediaIndex}`}
            alt={`${title} - draft image`}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-semibold text-black cursor-default leading-snug">{title}</h3>
            {/*<p className="text-sm text-gray-700 mt-2 line-clamp-3">{excerpt}</p>*/}
            <div className="text-xs text-gray-500 mt-3">Last saved: {formattedDate}</div>
          </div>
          <div className="flex-shrink-0">
            <Link href={editUrl}>
              <Button className="gap-2">Edit Draft</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePlaceholder(){
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 rounded-md">
      {/* decorative icon - suppress alt-text rule for this SVG icon */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image aria-hidden="true" className="w-8 h-8" />
    </div>
  );
}

export default function DraftsPage() {
  const { drafts, isLoading, hasMore, loadMore, refresh, error } = useDrafts();

  return (
    <RequireAuth redirectTo="/">
      <AppLayout currentPage="drafts">
        <div className="space-y-5">
          {/* Loading skeletons */}
          {isLoading && drafts.length === 0 && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-28 h-20 bg-gray-200 rounded-md" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-28 h-20 bg-gray-200 rounded-md" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">Failed to Load Drafts</h2>
                  <p className="text-red-700 max-w-md mx-auto">{error}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { refresh(); }} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Drafts list */}
          {drafts.map((d: DraftArticle) => (
            <DraftListItem key={d.id} draft={d} />
          ))}

          {/* Empty state */}
          {!isLoading && !error && drafts.length === 0 && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">No Drafts Found</h2>
                  <p className="text-muted-foreground">You don&apos;t have any drafts yet. Create your first article to get started.</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => refresh()} variant="outline">
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Load more button */}
          {hasMore && !isLoading && (
            <div className="text-center py-6">
              <Button onClick={loadMore} variant="outline" className="gap-2">
                <Loader2 className="h-4 w-4" />
                Load More Drafts
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    </RequireAuth>
  );
};
