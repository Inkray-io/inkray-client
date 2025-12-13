'use client';
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout, RightSidebar } from "@/components/layout";
import { useDrafts } from "@/hooks";
import useDraftMode from "@/hooks/useDraftMode";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { TopWriters } from "@/components/widgets/TopWriters";
import { AlertCircle, Loader2, RefreshCw, Pencil, Trash2, FileText } from "lucide-react";
import React, { useState } from "react";
import type { DraftArticle } from '@/types/article';
import { getPlainTextFromMarkdown } from "@/lib/utils/markdown";
import Link from 'next/link';


interface DraftListItemProps {
  draft: DraftArticle;
  onDelete: (draftId: string) => void;
  isDeleting: boolean;
}

function DraftListItem({ draft, onDelete, isDeleting }: DraftListItemProps) {
  const title = draft.title || 'Untitled Draft';
  const date = draft.updatedAt || draft.createdAt || '';

  // Friendly date formatting
  const formattedDate = date ? new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';

  // Generate excerpt from content
  const excerpt = (() => {
    if (!draft.content) return 'No content yet';
    const plain = getPlainTextFromMarkdown(draft.content);
    const trimmed = plain.trim().slice(0, 140);
    return trimmed.length < plain.trim().length ? trimmed + '...' : trimmed || 'No content yet';
  })();

  const editUrl = `/create?draft-id=${encodeURIComponent(draft.id)}`;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-black leading-snug">{title}</h3>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{excerpt}</p>
          <div className="text-xs text-gray-500 mt-3">Last saved: {formattedDate}</div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={editUrl}>
                <Button variant="outline" size="icon" className="size-8">
                  <Pencil className="size-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Edit draft</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => onDelete(draft.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete draft</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default function DraftsPage() {
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
        <div className="space-y-5">
          {/* Loading skeletons */}
          {isLoading && drafts.length === 0 && (
            <>
              <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
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
            <DraftListItem
              key={d.id}
              draft={d}
              onDelete={handleDeleteClick}
              isDeleting={deletingDraft && draftToDelete === d.id}
            />
          ))}

          {/* Empty state */}
          {!isLoading && !error && drafts.length === 0 && (
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-900">No Drafts Found</h2>
                  <p className="text-muted-foreground">You don&apos;t have any drafts yet. Create your first article to get started.</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link href="/create">
                    <Button>Create Article</Button>
                  </Link>
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
