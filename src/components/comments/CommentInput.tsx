"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  onSubmit: (content: string) => Promise<{ success: boolean; message: string }>;
  isSubmitting: boolean;
  placeholder?: string;
}

export function CommentInput({
  onSubmit,
  isSubmitting,
  placeholder = "Share your thoughts...",
}: CommentInputProps) {
  const { address, isConnected, suiNSName } = useWalletConnection();
  const { profile } = useProfile(address);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";

  const displayName = suiNSName || shortAddress;

  const charCount = content.length;
  const maxChars = 1000;
  const isNearLimit = charCount > maxChars * 0.9;
  const isOverLimit = charCount > maxChars;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isOverLimit) return;
    setError(null);
    const result = await onSubmit(content);
    if (result.success) {
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } else {
      setError(result.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 text-center border border-gray-100">
        <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-3">
          <PenLine className="h-5 w-5 text-primary/50" />
        </div>
        <p className="text-gray-600 text-sm font-medium mb-1">
          Join the conversation
        </p>
        <p className="text-gray-400 text-xs">
          Connect your wallet to share your thoughts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group rounded-xl transition-all duration-300",
          "bg-gray-50/60 hover:bg-gray-50/80",
          isFocused && "bg-white ring-2 ring-primary/10 shadow-sm",
          error && "ring-2 ring-red-100 bg-red-50/30"
        )}
      >
        <div className="flex gap-3.5 p-4">
          {/* User Avatar */}
          <div className="flex-shrink-0 pt-0.5">
            <Avatar
              src={profile?.avatar || undefined}
              alt={displayName}
              size="sm"
              fallbackText={(displayName || shortAddress).slice(0, 2).toUpperCase()}
              gradientColors="from-primary/60 to-primary"
            />
          </div>

          {/* Input Area */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isSubmitting}
              rows={1}
              className={cn(
                "w-full bg-transparent resize-none",
                "text-[15px] text-gray-700 placeholder:text-gray-400 placeholder:italic",
                "focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3",
          "border-t border-gray-100/80",
          isFocused && "border-gray-200/60"
        )}>
          {/* Character Count */}
          <span
            className={cn(
              "text-xs transition-colors tabular-nums",
              isOverLimit
                ? "text-red-500 font-medium"
                : isNearLimit
                  ? "text-amber-500"
                  : "text-gray-400"
            )}
          >
            {charCount}/{maxChars}
          </span>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || isOverLimit}
            size="sm"
            className={cn(
              "h-8 px-4 gap-2 rounded-lg",
              "transition-all duration-200",
              "disabled:opacity-40"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs px-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
