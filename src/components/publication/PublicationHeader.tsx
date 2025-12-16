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
import { cn } from '@/lib/utils';
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
    <div className="flex items-center gap-1.5 text-gray-500 group/stat">
      <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/5 group-hover/stat:bg-primary/10 transition-colors">
        <Icon className="w-3 h-3 text-primary/80" />
      </div>
      <span className="font-semibold text-gray-800 text-sm tabular-nums">{value.toLocaleString()}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

/**
 * Publication header component matching user profile layout
 *
 * Features avatar with gradient ring, publication info, description,
 * subscriber count, and action buttons.
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

  // Refresh follow status when publication data loads
  useEffect(() => {
    if (publication?.id && !isLoading) {
      log.debug('Publication follow state', {
        publicationId: publication.id,
        isFollowing: publication.isFollowing,
        followerCount: publication.followerCount
      }, 'PublicationHeader');

      // Refresh from server to ensure we have the correct state
      refreshFollowStatus();
    }
  }, [publication?.id, publication?.isFollowing, isLoading, refreshFollowStatus]);

  const handleToggleFollow = async () => {
    await toggleFollow();
  };

  if (isLoading) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-full h-10 mt-1" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!publication) return null;

  const avatarConfig = createPublicationAvatarConfig(publication, 'xl');

  return (
    <div className="px-5 py-5">
      <div className="flex items-start gap-4">
        {/* Avatar with animated gradient ring */}
        <div className="relative flex-shrink-0 group/avatar">
          <div
            className={cn(
              'absolute -inset-1 rounded-full blur-md opacity-60',
              'bg-gradient-to-br from-primary via-blue-400 to-purple-500',
              'group-hover/avatar:opacity-80 group-hover/avatar:scale-105',
              'transition-all duration-300'
            )}
          />
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-blue-400/30 to-purple-500/30 rounded-full" />
          <Avatar
            src={avatarConfig.src}
            alt={avatarConfig.alt}
            fallbackText={avatarConfig.fallbackText}
            className="relative w-[72px] h-[72px] ring-[3px] ring-white shadow-sm"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight truncate">
                  {publication.name}
                </h1>
                {publication.isVerified && <VerifiedBadge size="lg" />}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {isOwner ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditClick}
                  className={cn(
                    'gap-1.5 h-8 px-3 text-xs font-medium rounded-lg',
                    'border-gray-200 hover:border-primary/50',
                    'hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-500/5',
                    'hover:shadow-sm transition-all duration-200'
                  )}
                >
                  <HiPencil className="w-3.5 h-3.5" />
                  Edit
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

          {/* Description */}
          {publication.description && (
            <p className="mt-1.5 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-2">
              {publication.description}
            </p>
          )}

          {/* Stats - inline with subtle dividers */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatItem
              icon={HiUserGroup}
              value={followerCount || 0}
              label="followers"
            />
            <span className="w-px h-4 bg-gray-200" />
            <StatItem
              icon={HiDocumentText}
              value={publication.articleCount || 0}
              label="posts"
            />
            <span className="w-px h-4 bg-gray-200" />
            <TipDisplay amount={publication.totalTips || 0} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
