"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { useWalletConnection } from "@/hooks/useWalletConnection";
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
  const { address, isConnected } = useWalletConnection();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";

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
      <div className="bg-gray-50 rounded-xl p-5 text-center border border-dashed border-gray-200">
        <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm font-medium">
          Connect your wallet to join the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex gap-3 p-3 rounded-xl transition-all duration-200",
          "border border-gray-200",
          isFocused && "border-gray-300 shadow-sm",
          error && "border-red-200 bg-red-50/30"
        )}
      >
        {/* User Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          <Avatar
            alt={shortAddress}
            size="sm"
            fallbackText={shortAddress.slice(0, 2).toUpperCase()}
            gradientColors="from-blue-400 to-indigo-500"
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
              "text-sm text-gray-900 placeholder:text-gray-400",
              "focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            {/* Character Count */}
            <span
              className={cn(
                "text-xs transition-colors",
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
                "h-8 px-3 gap-1.5 rounded-lg",
                "transition-all duration-200"
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
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs px-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
