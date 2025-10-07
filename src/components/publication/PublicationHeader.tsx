import React, { useEffect } from 'react';
import { Publication } from '@/types/article';
import { useFollows } from '@/hooks/useFollows';
import { FollowButton } from '@/components/follow/FollowButton';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
    });
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
    <div className="bg-white rounded-2xl overflow-hidden">
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
              <div className="w-20 h-20 sm:w-25 sm:h-25 rounded-full overflow-hidden bg-white p-0.5 relative">
                {/* Ellipse background */}
                <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                
                {/* Avatar image */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    alt={publication.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' rx='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 25C55.5228 25 60 29.4772 60 35C60 40.5228 55.5228 45 50 45C44.4772 45 40 40.5228 40 35C40 29.4772 44.4772 25 50 25ZM50 50C61.0457 50 70 55.9543 70 62.5V75H30V62.5C30 55.9543 38.9543 50 50 50Z' fill='%239CA3AF'/%3E%3C/svg%3E`;
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Placeholder for top-right content if needed */}
            <div className="w-11 h-9"></div>
          </div>
        </div>
      </div>
      
      {/* Publication Info Section */}
      <div className="px-3 sm:px-6 pb-5">
        {/* Mobile Layout */}
        <div className="sm:hidden w-full">
          <div className="space-y-3 w-full">
            <div className="space-y-1.5 pl-3">
              <h1 className="font-semibold text-lg text-black leading-[1.4] pr-4">
                {publication.name}
              </h1>
              <p className="font-normal text-xs text-black/50 leading-[1.3]">
                From {formatDate(publication.createdAt)}
              </p>
            </div>
            {/* Follow Button - Mobile */}
            <div className="px-3">
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
              <div className="flex items-center w-full">
                <p className="font-normal text-xs text-black/50 leading-[1.3]">
                  From {formatDate(publication.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Follow Button - Desktop */}
          <div className="flex-shrink-0 ml-4">
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
          </div>
        </div>
        
        {/* Subscriber Stats */}
        <div className="flex gap-3 items-start px-3 sm:px-6 font-medium text-sm text-black leading-[1.3] mt-4.5">
          <span>{followerCount || 0} subscribers</span>
          <span>{publication.articleCount || 0} posts</span>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gray-200 mt-4.5"></div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-3 items-start px-3 sm:px-6 pt-3">
          <div className="flex gap-2.5 items-center justify-center pb-4 border-b-2 border-[#005efc]">
            <span className="font-medium text-sm text-black leading-[1.3]">Posts</span>
          </div>
          <div className="flex gap-2.5 items-center justify-center pb-4">
            <span className="font-medium text-sm text-black leading-[1.3]">Comments</span>
          </div>
        </div>
      </div>
    </div>
  );
};