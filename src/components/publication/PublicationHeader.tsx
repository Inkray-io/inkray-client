"use client";

import React, { useEffect } from 'react';
import { Publication } from '@/types/article';
import { useFollows } from '@/hooks/useFollows';
import { FollowButton } from '@/components/follow/FollowButton';
import { PublicationTipButton } from '@/components/publication/PublicationTipButton';
import { TipDisplay } from '@/components/ui/TipDisplay';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { addressesEqual } from '@/utils/address';
import { HiPencil, HiDocumentText, HiUserGroup } from 'react-icons/hi2';
import { log } from '@/lib/utils/Logger';
import { mastheadGradient } from '@/components/ui/Identicon';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface PublicationHeaderProps {
  publication: Publication;
  isLoading?: boolean;
  isOwner?: boolean;
  onEditClick?: () => void;
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <Icon className="size-3.5" />
      <span className="tabular-nums font-semibold text-gray-700 text-sm">
        {value.toLocaleString()}
      </span>
      {label}
    </span>
  );
}

/**
 * Publication masthead — the identity card from /publications discovery,
 * expanded: the publication's deterministic gradient banner with the emblem
 * overlapping, name + actions, description, and the muted stats row.
 */
export const PublicationHeader: React.FC<PublicationHeaderProps> = ({
  publication,
  isLoading = false,
  isOwner: isOwnerProp,
  onEditClick,
}) => {
  const { account } = useAuth();
  const {
    isFollowing,
    followerCount,
    isLoading: followLoading,
    toggleFollow,
    refreshFollowStatus,
  } = useFollows(publication?.id || '', publication ? {
    isFollowing: publication.isFollowing,
    followerCount: publication.followerCount,
  } : undefined);

  // Check if current user is the publication owner using normalized address comparison
  const isOwner = isOwnerProp !== undefined
    ? isOwnerProp
    : addressesEqual(account?.publicKey, publication?.owner);

  // Refresh follow status when publication data loads (authenticated only —
  // the status endpoint requires auth; anonymous visitors keep server counts)
  useEffect(() => {
    if (publication?.id && !isLoading && account) {
      log.debug('Publication follow state', {
        publicationId: publication.id,
        isFollowing: publication.isFollowing,
        followerCount: publication.followerCount
      }, 'PublicationHeader');

      // Refresh from server to ensure we have the correct state
      refreshFollowStatus();
    }
  }, [publication?.id, publication?.isFollowing, isLoading, account, refreshFollowStatus]);

  const handleToggleFollow = async () => {
    await toggleFollow();
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-20 w-full rounded-none" />
        <div className="px-5 pb-4">
          <Skeleton className="size-20 rounded-full -mt-10 ring-4 ring-white" />
          <Skeleton className="w-44 h-6 mt-3" />
          <Skeleton className="w-full h-10 mt-3" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!publication) return null;

  // 'lg' base size — overridden to w-20 below (the 'xl' variant carries
  // responsive sm:w-25 classes that would fight the masthead overlap)
  const avatarConfig = createPublicationAvatarConfig(publication, 'lg');

  return (
    <div>
      {/* Masthead — same deterministic hue family as the publication's
          identicon, matching its card on the /publications discovery grid */}
      <div
        className="h-20"
        style={{ background: mastheadGradient(avatarConfig.seed) }}
      />

      <div className="px-5 pb-4">
        <div className="flex items-end justify-between gap-3">
          {/* Emblem overlapping the masthead (z-10 so the banner doesn't paint over it) */}
          <div className="relative z-10 -mt-10 shrink-0">
            <Avatar
              {...avatarConfig}
              className="w-20 h-20 ring-4 ring-white shadow-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 mt-3">
            {isOwner ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <HiPencil className="w-3.5 h-3.5" />
                Edit publication
              </Button>
            ) : (
              <>
                <FollowButton
                  isFollowing={isFollowing}
                  isLoading={followLoading}
                  followerCount={followerCount}
                  onToggleFollow={handleToggleFollow}
                  showFollowerCount={false}
                />
                <PublicationTipButton
                  publicationId={publication.id}
                  publicationName={publication.name}
                />
              </>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-2.5 flex items-center gap-1.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight truncate">
            {publication.name}
          </h1>
          {publication.isVerified && <VerifiedBadge size="lg" />}
        </div>

        {/* Description — full width for room to breathe */}
        {publication.description ? (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
            {publication.description}
          </p>
        ) : (
          isOwner && (
            <button
              type="button"
              onClick={onEditClick}
              className="mt-2 text-sm text-gray-400 hover:text-primary transition-colors text-left"
            >
              Add a description so readers know what this publication is about →
            </button>
          )
        )}

        {/* Stats */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <StatItem
            icon={HiUserGroup}
            value={followerCount || 0}
            label={(followerCount || 0) === 1 ? 'follower' : 'followers'}
          />
          <StatItem
            icon={HiDocumentText}
            value={publication.articleCount || 0}
            label={(publication.articleCount || 0) === 1 ? 'post' : 'posts'}
          />
          <TipDisplay amount={publication.totalTips || 0} size="sm" />
        </div>
      </div>
    </div>
  );
};
