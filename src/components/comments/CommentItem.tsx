"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  id: string;
  content: string;
  author: {
    id: string;
    publicKey: string;
    username: string | null;
    avatar: string | null;
    shortAddress: string;
  };
  createdAt: string;
  isOwner: boolean;
  isDeleting: boolean;
  onDelete: (commentId: string) => void;
}

export function CommentItem({
  id,
  content,
  author,
  createdAt,
  isOwner,
  isDeleting,
  onDelete,
}: CommentItemProps) {
  const displayName = author.username || author.shortAddress;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative py-4 first:pt-0 last:pb-0",
        "border-b border-gray-100 last:border-b-0",
        "transition-colors duration-200"
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar
            src={author.avatar}
            alt={displayName}
            size="sm"
            fallbackText={displayName.slice(0, 2).toUpperCase()}
            gradientColors="from-indigo-400 to-purple-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {timeAgo}
              </span>
            </div>

            {/* Delete Button */}
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-full",
                  "text-gray-400 hover:text-red-500 hover:bg-red-50",
                  "opacity-0 group-hover:opacity-100",
                  "transition-all duration-200",
                  isDeleting && "opacity-100"
                )}
                onClick={() => onDelete(id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}
