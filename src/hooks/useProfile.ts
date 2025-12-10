"use client";

import { useState, useEffect, useCallback } from 'react';
import { usersAPI, SocialAccounts } from '@/lib/api';
import { useSuiNS } from './useSuiNS';
import { log } from '@/lib/utils/Logger';

export interface ProfileStats {
  articlesCount: number;
  publicationsCount: number;
  totalViews: number;
}

export interface Profile {
  id: string;
  publicKey: string;
  username: string | null;
  avatar: string | null;
  description: string | null;
  skills: string[] | null;
  socialAccounts: SocialAccounts | null;
  createdAt: string;
  stats: ProfileStats;
}

interface UseProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing user profile data
 *
 * @param address - The wallet address to fetch profile for
 */
export const useProfile = (address?: string) => {
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  // Get SuiNS name for the address
  const { name: suiNSName, loading: suiNSLoading } = useSuiNS(address);

  /**
   * Fetch profile data from API
   */
  const fetchProfile = useCallback(async () => {
    if (!address) {
      setState({
        profile: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await usersAPI.getPublicProfile(address);

      if (response.data?.data) {
        setState({
          profile: response.data.data,
          isLoading: false,
          error: null,
        });

        log.debug(
          'Profile loaded successfully',
          {
            address,
            username: response.data.data.username,
          },
          'useProfile'
        );
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      log.error('Failed to fetch profile', { error, address }, 'useProfile');

      let errorMessage = 'Failed to load profile';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { status: number; data?: { message: string } };
        };
        if (axiosError.response?.status === 404) {
          // User doesn't have a profile yet - create empty profile structure
          setState({
            profile: {
              id: '',
              publicKey: address,
              username: null,
              avatar: null,
              description: null,
              skills: null,
              socialAccounts: null,
              createdAt: new Date().toISOString(),
              stats: {
                articlesCount: 0,
                publicationsCount: 0,
                totalViews: 0,
              },
            },
            isLoading: false,
            error: null,
          });
          return;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [address]);

  /**
   * Refresh profile data
   */
  const refresh = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Load profile when address changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    // State
    ...state,
    suiNSName,
    suiNSLoading,

    // Actions
    refresh,
    clearError,

    // Computed
    hasError: !!state.error,
    profileExists: !!state.profile?.id,
    displayName: suiNSName || state.profile?.publicKey || '',
  };
};
