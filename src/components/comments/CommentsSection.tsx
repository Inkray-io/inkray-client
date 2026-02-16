"use client";

import {
  Loader2,
  AlertCircle,
  ChevronDown,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComments } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
  articleId: string;
  className?: string;
  compact?: boolean;
}

export function CommentsSection({ articleId, className, compact = false }: CommentsSectionProps) {
  const {
    comments,
    isLoading,
    isLoadingMore,
    isSubmitting,
    isDeleting,
    error,
    hasMore,
    loadMore,
    submitComment,
    deleteComment,
    clearError,
    hasError,
  } = useComments(articleId);

  return (
    <div className={cn(compact ? "pt-0 mt-0" : "pt-10 mt-6", className)}>
      {/* Editorial Section Divider */}
      {!compact && (
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <div className="flex items-center gap-2.5">
            <span className="text-primary/50 text-xs">✦</span>
            <span className="font-medium tracking-widest uppercase text-[11px] text-gray-400">
              Conversation
            </span>
            <span className="text-primary/50 text-xs">✦</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}

      {/* Response Count */}
      {!isLoading && comments.length > 0 && (
        <p className="text-sm text-gray-500 mb-6">
          {comments.length} {comments.length === 1 ? 'response' : 'responses'}
          {hasMore ? '+' : ''}
        </p>
      )}

      {/* Comment Input */}
      <div className="mb-8">
        <CommentInput onSubmit={submitComment} isSubmitting={isSubmitting} />
      </div>

      {/* Error Alert */}
      {hasError && error && (
        <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50/80 p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2 duration-300 border border-red-100">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
            </div>
          </div>
          <span className="text-sm text-gray-400 mt-4">Loading responses...</span>
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-1">
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CommentItem
                id={comment.id}
                content={comment.content}
                author={comment.author}
                createdAt={comment.createdAt}
                isOwner={comment.isOwner}
                isDeleting={isDeleting === comment.id}
                onDelete={deleteComment}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && comments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <PenLine className="h-6 w-6 text-primary/40" />
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">
            No responses yet
          </p>
          <p className="text-gray-400 text-xs max-w-[200px] mx-auto">
            Start the conversation by sharing your thoughts above
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <Button
            variant="ghost"
            onClick={loadMore}
            disabled={isLoadingMore}
            className={cn(
              "text-gray-500 hover:text-gray-700 hover:bg-gray-50/80",
              "gap-2 h-10 px-5 rounded-xl",
              "transition-all duration-300",
              "border border-transparent hover:border-gray-200"
            )}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Load more responses</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
