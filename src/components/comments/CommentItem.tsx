"use client";

import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { AddressDisplay } from "@/components/ui/AddressDisplay";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

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
  const router = useRouter();
  const displayName = author.username || author.shortAddress;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleAuthorClick = () => {
    if (author.publicKey) {
      router.push(ROUTES.PROFILE_WITH_ID(author.publicKey));
    }
  };

  return (
    <div
      className={cn(
        "group relative py-5 first:pt-0",
        "pl-4 border-l-2 border-gray-100",
        "hover:border-primary/30 hover:bg-primary/[0.015]",
        "transition-all duration-300 ease-out",
        "-ml-4 rounded-r-lg"
      )}
    >
      <div className="flex gap-3.5">
        {/* Avatar */}
        <button
          type="button"
          onClick={handleAuthorClick}
          className="flex-shrink-0 hover:scale-105 transition-transform duration-200"
        >
          <Avatar
            src={author.avatar}
            alt={displayName}
            size="sm"
            fallbackText={displayName.slice(0, 2).toUpperCase()}
            gradientColors="from-primary/60 to-primary"
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {author.username ? (
                <button
                  type="button"
                  onClick={handleAuthorClick}
                  className="text-sm font-semibold text-gray-800 truncate hover:text-primary transition-colors"
                >
                  {author.username}
                </button>
              ) : (
                <AddressDisplay
                  address={author.publicKey}
                  variant="compact"
                  linkToProfile
                  className="text-sm font-semibold text-gray-800"
                />
              )}
              <span className="text-gray-200">·</span>
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
                  "h-7 w-7 rounded-lg",
                  "text-gray-300 hover:text-red-400 hover:bg-red-50/80",
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
          <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line break-words">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}
