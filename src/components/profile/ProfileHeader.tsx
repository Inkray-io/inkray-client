"use client";

import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserAvatarConfig } from '@/lib/utils/avatar';
import { formatAddress } from '@/utils/address';
import { HiPencil, HiDocumentText, HiUserGroup, HiEye } from 'react-icons/hi2';
import { Profile } from '@/hooks/useProfile';

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
    <div className="flex items-center gap-1.5 text-gray-500">
      <Icon className="w-3.5 h-3.5 text-primary/70" />
      <span className="font-semibold text-gray-800 text-sm">{value.toLocaleString()}</span>
      <span className="text-xs">{label}</span>
    </div>
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
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-full h-10 mt-1" />
          </div>
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
    'xl'
  );

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar
            {...avatarConfig}
            className="w-16 h-16"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {suiNSLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  displayName
                )}
              </h1>
              {hasResolvedName && profile?.publicKey && (
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {formatAddress(profile.publicKey)}
                </p>
              )}
            </div>

            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="gap-1.5 h-8 px-3 text-xs rounded-lg border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <HiPencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>

          {/* Description */}
          {profile?.description && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-2">
              {profile.description}
            </p>
          )}

          {/* Stats - inline */}
          {profile?.stats && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatItem
                icon={HiDocumentText}
                value={profile.stats.articlesCount}
                label="articles"
              />
              <StatItem
                icon={HiUserGroup}
                value={profile.stats.publicationsCount}
                label="publications"
              />
              <StatItem
                icon={HiEye}
                value={profile.stats.totalViews}
                label="views"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
