"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import {
  usePublicationFollowers,
  PublicationFollower,
} from '@/hooks/usePublicationFollowers';
import { useSuiNSBatchChunked } from '@/hooks/useSuiNSBatchChunked';
import { ROUTES } from '@/constants/routes';
import { HiUserGroup } from 'react-icons/hi2';

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationId: string;
  followerCount: number;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatFollowedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Popup follower list for a publication — opened from the followers stat
 * in the publication header. Infinite scroll, newest followers first.
 */
export function FollowersDialog({
  open,
  onOpenChange,
  publicationId,
  followerCount,
}: FollowersDialogProps) {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicationFollowers(publicationId, open);

  const followers: PublicationFollower[] =
    data?.pages.flatMap((p) => p.followers) ?? [];

  // Resolve SuiNS names for wallet-only followers (chunked — no 50-row cap)
  const unnamedAddresses = followers
    .filter((f) => !f.username)
    .map((f) => f.publicKey);
  const { getName } = useSuiNSBatchChunked(unnamedAddresses, { enabled: open });

  // Infinite scroll sentinel rooted in the dialog's scroll panel
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: '120px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, followers.length]);

  const handleRowClick = (publicKey: string) => {
    onOpenChange(false);
    router.push(ROUTES.PROFILE_WITH_ID(publicKey));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Followers{' '}
            <span className="text-sm font-normal text-gray-400 tabular-nums">
              {followerCount.toLocaleString()}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain"
        >
          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError && followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-14 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-3">
                <HiUserGroup className="size-6 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Couldn&apos;t load followers
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs font-medium text-primary hover:underline mt-1"
              >
                Try again
              </button>
            </div>
          ) : followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-14 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-3">
                <HiUserGroup className="size-6 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                No followers yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Be the first to follow this publication.
              </p>
            </div>
          ) : (
            <div>
              {followers.map((follower) => {
                const displayName =
                  follower.username ||
                  getName(follower.publicKey) ||
                  truncateAddress(follower.publicKey);

                return (
                  <button
                    key={follower.id}
                    type="button"
                    onClick={() => handleRowClick(follower.publicKey)}
                    className="w-full flex items-center gap-3 py-2 px-1 text-left rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                  >
                    <Avatar
                      {...createUserAvatarConfig(
                        {
                          id: follower.id,
                          publicKey: follower.publicKey,
                          name: follower.username || undefined,
                          avatar: follower.avatar,
                        },
                        'sm',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Followed {formatFollowedDate(follower.followedAt)}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Infinite scroll sentinel + loading tail */}
              <div ref={sentinelRef} />
              {isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
