import React, { useEffect } from 'react';
import { Publication } from '@/types/article';
import { useFollows } from '@/hooks/useFollows';
import { FollowButton } from '@/components/follow/FollowButton';
import { PublicationTipButton } from '@/components/publication/PublicationTipButton';
import { TipDisplay } from '@/components/ui/TipDisplay';
import { Avatar } from '@/components/ui/Avatar';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { addressesEqual } from '@/utils/address';
import { Image } from 'lucide-react';
import { HiCog6Tooth } from 'react-icons/hi2';
import Link from 'next/link';

interface PublicationHeaderProps {
  publication: Publication;
  isLoading?: boolean;
}

/**
 * Publication header component matching Figma design
 * 
 * Features cover image with gradient overlay, profile avatar, publication info,
 * subscriber count, and subscribe button in the exact layout from Figma.
 */
export const PublicationHeader: React.FC<PublicationHeaderProps> = ({
  publication,
  isLoading = false,
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
  const isOwner = addressesEqual(account?.publicKey, publication?.owner);

  // Refresh follow status when publication data loads
  useEffect(() => {
    if (publication?.id && !isLoading) {
      console.log('Publication follow state:', {
        publicationId: publication.id,
        isFollowing: publication.isFollowing,
        followerCount: publication.followerCount
      });
      
      // Refresh from server to ensure we have the correct state
      refreshFollowStatus();
    }
  }, [publication?.id, publication?.isFollowing, isLoading, refreshFollowStatus]);

  const handleToggleFollow = async () => {
    await toggleFollow();
  };


  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="animate-pulse">
          {/* Cover image skeleton */}
          <div className="h-40 sm:h-60 bg-neutral-200 rounded-tl-2xl rounded-tr-2xl"></div>
          
          {/* Profile section skeleton */}
          <div className="px-3 sm:px-6 pb-5">
            <div className="flex items-end justify-between -mt-8 sm:-mt-12 pb-2.5">
              <div className="flex items-center gap-7.5">
                <div className="w-20 h-20 sm:w-25 sm:h-25 bg-gray-300 rounded-full"></div>
              </div>
            </div>
            
            {/* Mobile Layout Skeleton */}
            <div className="sm:hidden w-full">
              <div className="space-y-3 w-full">
                <div className="space-y-1.5 pl-3">
                  <div className="h-5 bg-gray-300 rounded w-48 max-w-[calc(100%-2rem)]"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="px-3">
                  <div className="h-9 bg-gray-300 rounded w-24"></div>
                </div>
              </div>
            </div>

            {/* Desktop Layout Skeleton */}
            <div className="hidden sm:flex items-start justify-between w-full">
              <div className="flex-shrink-0 min-w-0 flex-1">
                <div className="pl-6 space-y-1.5 pr-4">
                  <div className="h-5 bg-gray-300 rounded w-48 max-w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="h-9 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            
            <div className="mt-4 flex gap-3 px-3 sm:px-0">
              <div className="h-4 bg-gray-300 rounded w-24"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!publication) return null;

  return (
    <div className="bg-white rounded-t-2xl overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-60 bg-gray-100 rounded-tl-2xl rounded-tr-2xl overflow-hidden flex items-center justify-center">
        {/* Placeholder Image */}
        <Image className="w-16 h-16 text-gray-400" />
        
        {/* Gradient overlay for avatar contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        
        {/* Profile section overlaying the cover */}
        <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 pb-2.5">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-7.5">
              {/* Profile Avatar */}
              {(() => {
                const avatarConfig = createPublicationAvatarConfig(publication, 'xl');
                return (
                  <Avatar
                    src={avatarConfig.src}
                    alt={avatarConfig.alt}
                    size="xl"
                    gradientBorder={true}
                    fallbackText={avatarConfig.fallbackText}
                  />
                );
              })()}
            </div>
            
            {/* Placeholder for top-right content if needed */}
            <div className="w-11 h-9"></div>
          </div>
        </div>
      </div>
      
      {/* Publication Info Section */}
      <div className="px-5 pb-6 pt-6">
        {/* Header with name and buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-black leading-[1.4] truncate">
              {publication.name}
            </h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {isOwner ? (
              <Link href={ROUTES.PUBLICATION_SETTINGS(publication.id)}>
                <Button variant="outline" size="sm" className="gap-2">
                  <HiCog6Tooth className="size-4" />
                  Settings
                </Button>
              </Link>
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
        
        {/* Subscriber Stats */}
        <div className="flex gap-3 items-start text-xs text-gray-500 mt-4">
          <span>{followerCount || 0} subscribers</span>
          <span>{publication.articleCount || 0} posts</span>
          <TipDisplay amount={publication.totalTips || 0} size="sm" />
        </div>
      </div>
    </div>
  );
};