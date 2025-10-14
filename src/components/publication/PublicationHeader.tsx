import React, { useEffect } from 'react';
import { Publication } from '@/types/article';
import { useFollows } from '@/hooks/useFollows';
import { FollowButton } from '@/components/follow/FollowButton';
import { PublicationTipButton } from '@/components/publication/PublicationTipButton';
import { TipDisplay } from '@/components/ui/TipDisplay';
import { Avatar } from '@/components/ui/Avatar';
import { createPublicationAvatarConfig } from '@/lib/utils/avatar';

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
      <div className="relative h-40 sm:h-60 bg-neutral-200 rounded-tl-2xl rounded-tr-2xl overflow-hidden">
        {/* Background cover image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop')`
          }}
        />
        
        {/* Gradient overlay matching Figma */}
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
      <div className="px-3 sm:px-6 pb-6 pt-6">
        {/* Mobile Layout */}
        <div className="sm:hidden w-full">
          <div className="space-y-3 w-full">
            <div className="space-y-1.5 pl-3">
              <h1 className="font-semibold text-lg text-black leading-[1.4] pr-4">
                {publication.name}
              </h1>
            </div>
            {/* Action Buttons - Mobile */}
            <div className="px-3 flex gap-3">
              <FollowButton
                isFollowing={isFollowing}
                isLoading={followLoading}
                followerCount={followerCount}
                onToggleFollow={handleToggleFollow}
                variant="default"
                size="default"
                showFollowerCount={false}
                className="bg-[#005efc] hover:bg-[#0052d9] text-white font-semibold text-sm"
              />
              <PublicationTipButton
                publicationId={publication.id}
                publicationName={publication.name}
                size="default"
              />
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-start justify-between w-full">
          <div className="flex-shrink-0 min-w-0 flex-1">
            <div className="pl-6 space-y-1.5 pr-4">
              <h1 className="font-semibold text-lg text-black leading-[1.4] truncate">
                {publication.name}
              </h1>
            </div>
          </div>
          
          {/* Action Buttons - Desktop */}
          <div className="flex-shrink-0 ml-4 flex gap-3">
            <FollowButton
              isFollowing={isFollowing}
              isLoading={followLoading}
              followerCount={followerCount}
              onToggleFollow={handleToggleFollow}
              variant="default"
              size="default"
              showFollowerCount={false}
              className="bg-[#005efc] hover:bg-[#0052d9] text-white font-semibold text-base px-3 py-3 rounded-[10px]"
            />
            <PublicationTipButton
              publicationId={publication.id}
              publicationName={publication.name}
              size="default"
            />
          </div>
        </div>
        
        {/* Subscriber Stats */}
        <div className="flex gap-3 items-start px-3 sm:px-6 font-medium text-sm text-black leading-[1.3] mt-4.5">
          <span>{followerCount || 0} subscribers</span>
          <span>{publication.articleCount || 0} posts</span>
          <TipDisplay amount={publication.totalTips || 0} size="sm" />
        </div>
      </div>
    </div>
  );
};