'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { TopWriters } from '@/components/widgets/TopWriters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserArticles } from '@/hooks/useUserArticles';
import {
  ProfileHeader,
  ProfileSkills,
  ProfileSocialLinks,
  ProfileArticles,
  ProfileEditModal,
} from '@/components/profile';

/**
 * Profile page skeleton loader
 */
function ProfilePageSkeleton() {
  return (
    <AppLayout currentPage="profile">
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header skeleton */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-4 text-center sm:text-left w-full">
              <div className="space-y-2">
                <Skeleton className="w-48 h-7 mx-auto sm:mx-0" />
                <Skeleton className="w-32 h-4 mx-auto sm:mx-0" />
              </div>
              <Skeleton className="w-full h-16" />
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <Skeleton className="w-28 h-14 rounded-xl" />
                <Skeleton className="w-28 h-14 rounded-xl" />
                <Skeleton className="w-28 h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        {/* Skills skeleton */}
        <div className="px-6 sm:px-8 py-6 border-t border-gray-100">
          <Skeleton className="w-24 h-6 mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="w-32 h-8 rounded-full" />
            <Skeleton className="w-28 h-8 rounded-full" />
            <Skeleton className="w-36 h-8 rounded-full" />
          </div>
        </div>
        {/* Articles skeleton */}
        <div className="px-6 sm:px-8 py-6 border-t border-gray-100">
          <Skeleton className="w-24 h-6 mb-4" />
          <div className="space-y-3">
            <Skeleton className="w-full h-28 rounded-xl" />
            <Skeleton className="w-full h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Profile page content component
 */
const ProfilePageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const addressParam = searchParams.get('id');
  const { address: currentUserAddress } = useWalletConnection();
  const { isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine which address to show profile for
  const profileAddress = useMemo(() => {
    if (addressParam) return addressParam;
    if (isAuthenticated && currentUserAddress) return currentUserAddress;
    return undefined;
  }, [addressParam, isAuthenticated, currentUserAddress]);

  // Check if viewing own profile
  const isOwnProfile = useMemo(() => {
    if (!profileAddress || !currentUserAddress) return false;
    return profileAddress.toLowerCase() === currentUserAddress.toLowerCase();
  }, [profileAddress, currentUserAddress]);

  // Fetch profile data
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    suiNSName,
    suiNSLoading,
    refresh: refreshProfile,
    clearError: clearProfileError,
  } = useProfile(profileAddress);

  // Fetch user articles
  const {
    articles,
    isLoading: articlesLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error: articlesError,
    refresh: refreshArticles,
  } = useUserArticles(profileAddress);

  // Handle no profile address
  if (!profileAddress) {
    return (
      <AppLayout currentPage="profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isAuthenticated
                ? 'Unable to load your profile. Please try reconnecting your wallet.'
                : 'Please connect your wallet to view your profile, or provide a profile address in the URL.'}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // Handle profile loading error
  if (profileError && !profileLoading) {
    return (
      <AppLayout currentPage="profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Alert className="max-w-md mx-auto" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                clearProfileError();
                refreshProfile();
              }}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Handle profile refresh after edit
  const handleEditSuccess = () => {
    refreshProfile();
    refreshArticles();
  };

  // Right sidebar content
  const rightSidebar = (
    <div className="space-y-5">
      <TopWriters />
    </div>
  );

  return (
    <AppLayout
      currentPage="profile"
      rightSidebar={rightSidebar}
      showRightSidebar={true}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          suiNSName={suiNSName || ''}
          suiNSLoading={suiNSLoading}
          isLoading={profileLoading}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setIsEditModalOpen(true)}
        />

        {/* Skills Section */}
        {!profileLoading && profile?.skills && profile.skills.length > 0 && (
          <ProfileSkills skills={profile.skills} />
        )}

        {/* Social Links Section */}
        {!profileLoading && profile?.socialAccounts && (
          <ProfileSocialLinks socialAccounts={profile.socialAccounts} />
        )}

        {/* Articles Section */}
        <ProfileArticles
          articles={articles}
          isLoading={articlesLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />

        {/* Articles Error */}
        {articlesError && !articlesLoading && (
          <div className="px-6 sm:px-8 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{articlesError}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSuccess={handleEditSuccess}
        />
      )}
    </AppLayout>
  );
};

/**
 * Profile page
 *
 * Displays user profile information.
 * - /profile - Shows current user's profile (requires auth)
 * - /profile?id=[ADDRESS] - Shows profile for specified address
 */
const ProfilePage: React.FC = () => {
  return (
    <RequireAuth>
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfilePageContent />
      </Suspense>
    </RequireAuth>
  );
};

export default ProfilePage;
