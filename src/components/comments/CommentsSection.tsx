"use client";

import {
  MessageCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComments } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { cn } from "@/lib/utils";

interface CommentsSectionProps {
  articleId: string;
  className?: string;
}

export function CommentsSection({ articleId, className }: CommentsSectionProps) {
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
    <div className={cn("bg-white rounded-xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
          <MessageCircle className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Comments</h3>
        {comments.length > 0 && (
          <span className="text-sm text-gray-400 font-normal">
            ({comments.length}
            {hasMore ? "+" : ""})
          </span>
        )}
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        <CommentInput onSubmit={submitComment} isSubmitting={isSubmitting} />
      </div>

      {/* Error Alert */}
      {hasError && error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300 mb-2" />
          <span className="text-sm text-gray-400">Loading comments...</span>
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length > 0 && (
        <div className="divide-y divide-gray-100">
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
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">
            No comments yet
          </p>
          <p className="text-gray-400 text-xs">
            Be the first to share your thoughts!
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Button
            variant="ghost"
            onClick={loadMore}
            disabled={isLoadingMore}
            className={cn(
              "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              "gap-1.5 h-9 px-4 rounded-lg",
              "transition-all duration-200"
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
                <span>Load more comments</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
