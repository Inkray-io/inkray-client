'use client';

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout, RightSidebar } from "@/components/layout";
import { useDrafts } from "@/hooks";
import useDraftMode from "@/hooks/useDraftMode";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TopWriters } from "@/components/widgets/TopWriters";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, RefreshCw, Pencil, Trash2, FileText, Clock, ImageIcon, Plus } from "lucide-react";
import React, { useState, Suspense } from "react";
import type { DraftArticle } from '@/types/article';
import { getPlainTextFromMarkdown } from "@/lib/utils/markdown";
import { CONFIG } from "@/lib/config";
import Link from 'next/link';

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Draft Card Skeleton
function DraftCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Cover image skeleton */}
        <div className="sm:w-48 sm:flex-shrink-0">
          <Skeleton className="w-full h-36 sm:h-full" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DraftCardProps {
  draft: DraftArticle;
  onDelete: (draftId: string) => void;
  isDeleting: boolean;
}

function DraftCard({ draft, onDelete, isDeleting }: DraftCardProps) {
  const title = draft.title || 'Untitled Draft';
  const date = draft.updatedAt || draft.createdAt || '';
  const relativeTime = date ? formatRelativeTime(date) : 'Unknown';

  // Get first draft image for cover
  const firstImage = draft.images?.[0];
  const coverUrl = firstImage
    ? `${CONFIG.API_URL}/articles/draft/${draft.id}/media/${firstImage.id}`
    : undefined;

  // Generate excerpt from content
  const excerpt = (() => {
    if (!draft.content) return 'Start writing your story...';
    const plain = getPlainTextFromMarkdown(draft.content);
    const trimmed = plain.trim().slice(0, 160);
    return trimmed.length < plain.trim().length ? trimmed + '...' : trimmed || 'Start writing your story...';
  })();

  const editUrl = `/create?draft-id=${encodeURIComponent(draft.id)}`;

  // Calculate word count
  const wordCount = draft.content
    ? getPlainTextFromMarkdown(draft.content).split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all duration-200">
      <div className="flex flex-col sm:flex-row">
        {/* Cover Image Section */}
        <Link
          href={editUrl}
          className="sm:w-48 sm:flex-shrink-0 relative overflow-hidden"
        >
          {coverUrl ? (
            <div className="relative w-full h-36 sm:h-full bg-gray-50">
              <img
                src={coverUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="w-full h-36 sm:h-full min-h-[120px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">No cover</span>
              </div>
            </div>
          )}
        </Link>

        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
          <div>
            {/* Title */}
            <Link href={editUrl}>
              <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {title}
              </h3>
            </Link>

            {/* Excerpt */}
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {excerpt}
            </p>
          </div>

          {/* Footer with metadata and actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {relativeTime}
              </span>
              {wordCount > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{wordCount} words</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={editUrl}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium gap-1.5 border-gray-200 hover:border-primary hover:text-primary"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Continue editing</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(draft.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete draft</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftsPageContent() {
  const { drafts, isLoading, hasMore, loadMore, refresh, error } = useDrafts();
  const { deleteDraft, deletingDraft } = useDraftMode();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const handleDeleteClick = (draftId: string) => {
    setDraftToDelete(draftId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;
    const success = await deleteDraft(draftToDelete);
    if (success) {
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
      refresh();
    }
  };

  return (
    <RequireAuth redirectTo="/">
      <AppLayout
        currentPage="drafts"
        rightSidebar={
          <RightSidebar>
            <TopWriters />
          </RightSidebar>
        }
      >
        <div className="space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Your Drafts</h1>
              {!isLoading && drafts.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {drafts.length} draft{drafts.length !== 1 ? 's' : ''} in progress
                </p>
              )}
            </div>
            <Link href="/create">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                New Draft
              </Button>
            </Link>
          </div>

          {/* Loading skeletons */}
          {isLoading && drafts.length === 0 && (
            <div className="space-y-4">
              <DraftCardSkeleton />
              <DraftCardSkeleton />
              <DraftCardSkeleton />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-white rounded-2xl border border-red-100 p-8">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-gray-900">Failed to Load Drafts</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">{error}</p>
                </div>
                <Button onClick={refresh} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Drafts list */}
          {!error && drafts.length > 0 && (
            <div className="space-y-4">
              {drafts.map((draft: DraftArticle) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onDelete={handleDeleteClick}
                  isDeleting={deletingDraft && draftToDelete === draft.id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && drafts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10">
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">No drafts yet</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Your unpublished work will appear here. Start writing to create your first draft.
                  </p>
                </div>
                <Link href="/create">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Start Writing
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Load more button */}
          {hasMore && !isLoading && (
            <div className="text-center py-4">
              <Button
                onClick={loadMore}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                Load More
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {isLoading && drafts.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Draft"
          description="Are you sure you want to delete this draft? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          isLoading={deletingDraft}
          variant="destructive"
        />
      </AppLayout>
    </RequireAuth>
  );
}

export default function DraftsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <DraftsPageContent />
    </Suspense>
  );
}
