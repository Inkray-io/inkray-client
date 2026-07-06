"use client";

import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { formatAddress } from '@/utils/address';
import { HiPencil, HiDocumentText, HiUserGroup, HiEye } from 'react-icons/hi2';
import { Profile } from '@/hooks/useProfile';
import { mastheadGradient } from '@/components/ui/Identicon';
import { EarlyAdopterBadge } from '@/components/ui/EarlyAdopterBadge';
import { isEarlyAdopter } from '@/lib/utils/earlyAdopter';
import { formatMonthYear } from '@/lib/utils/date';

interface ProfileHeaderProps {
  profile: Profile | null;
  suiNSName: string;
  suiNSLoading: boolean;
  isLoading: boolean;
  isOwnProfile: boolean;
  onEditClick: () => void;
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

export function ProfileHeader({
  profile,
  suiNSName,
  suiNSLoading,
  isLoading,
  isOwnProfile,
  onEditClick,
}: ProfileHeaderProps) {
  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-20 w-full rounded-none" />
        <div className="px-5 pb-4">
          <Skeleton className="size-20 rounded-full -mt-10 ring-4 ring-white" />
          <Skeleton className="w-44 h-6 mt-3" />
          <Skeleton className="w-28 h-3 mt-2" />
          <Skeleton className="w-full h-10 mt-3" />
        </div>
      </div>
    );
  }

  const displayName = suiNSName || formatAddress(profile?.publicKey || '');
  const hasResolvedName = !!suiNSName;

  const avatarConfig = createUserAvatarConfig(
    {
      id: profile?.id,
      publicKey: profile?.publicKey,
      name: profile?.username || undefined,
      avatar: profile?.avatar || undefined,
    },
    // 'lg' base size — overridden to w-20 below (the 'xl' variant carries
    // responsive sm:w-25 classes that would fight the masthead overlap)
    'lg'
  );

  return (
    <div>
      {/* Masthead — same deterministic hue family as the identicon (rich
          banner vs. pale avatar body guarantees contrast) */}
      <div
        className="h-20"
        style={{ background: mastheadGradient(avatarConfig.seed) }}
      />

      <div className="px-5 pb-4">
        <div className="flex items-end justify-between gap-3">
          {/* Avatar overlapping the masthead (z-10 so the banner doesn't paint over it) */}
          <div className="relative z-10 -mt-10 shrink-0">
            <Avatar
              {...avatarConfig}
              className="w-20 h-20 ring-4 ring-white shadow-sm"
            />
          </div>

          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditClick}
              className="gap-1.5 h-8 px-3 text-xs rounded-lg border-gray-200 hover:border-primary hover:bg-primary/5 transition-all mt-3"
            >
              <HiPencil className="w-3.5 h-3.5" />
              Edit profile
            </Button>
          )}
        </div>

        {/* Identity */}
        <div className="mt-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {suiNSLoading ? (
                <span className="text-gray-400">Loading…</span>
              ) : (
                displayName
              )}
            </h1>
            {isEarlyAdopter(profile?.createdAt) && (
              <EarlyAdopterBadge variant="full" />
            )}
          </div>
          {hasResolvedName && profile?.publicKey && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {formatAddress(profile.publicKey)}
            </p>
          )}
          {profile?.createdAt && (
            <p className="text-xs text-gray-400 mt-1">
              Joined {formatMonthYear(profile.createdAt)}
            </p>
          )}
        </div>

        {/* Bio — full width, the reader's 3-second answer to "who is this?" */}
        {profile?.description ? (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
            {profile.description}
          </p>
        ) : (
          isOwnProfile && (
            <button
              type="button"
              onClick={onEditClick}
              className="mt-2 text-sm text-gray-400 hover:text-primary transition-colors text-left"
            >
              Add a bio so readers know what you write about →
            </button>
          )
        )}

        {/* Stats */}
        {profile?.stats && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <StatItem
              icon={HiDocumentText}
              value={profile.stats.articlesCount}
              label={profile.stats.articlesCount === 1 ? 'article' : 'articles'}
            />
            <StatItem
              icon={HiUserGroup}
              value={profile.stats.publicationsCount}
              label={
                profile.stats.publicationsCount === 1
                  ? 'publication'
                  : 'publications'
              }
            />
            <StatItem icon={HiEye} value={profile.stats.totalViews} label="views" />
          </div>
        )}
      </div>
    </div>
  );
}
