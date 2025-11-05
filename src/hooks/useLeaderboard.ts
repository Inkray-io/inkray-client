import { useState, useEffect, useCallback } from 'react';
import { leaderboardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  publicKey: string;
  username: string | null;
  avatar: string | null;
  totalXP: number;
  accountCreated: string;
}

interface LeaderboardState {
  topEntries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  usersAroundMe: LeaderboardEntry[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useLeaderboard = () => {
  const { account, isAuthenticated } = useAuth();
  const [state, setState] = useState<LeaderboardState>({
    topEntries: [],
    userEntry: null,
    usersAroundMe: [],
    userRank: null,
    isLoading: true,
    error: null,
  });

  const fetchLeaderboard = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch top 50 users
      const leaderboardResponse = await leaderboardAPI.getLeaderboard({
        limit: 50,
        offset: 0,
      });

      const topEntries = leaderboardResponse.data.data.entries || [];

      // If user is authenticated, fetch their rank and surrounding users
      let userEntry = null;
      let usersAroundMe: LeaderboardEntry[] = [];
      let userRank = null;

      if (isAuthenticated && account) {
        try {
          // Get user's XP and rank
          const myXPResponse = await leaderboardAPI.getMyXP();
          userRank = myXPResponse.data.data.rank;

          // Check if user is in top 50
          const isInTop50 = topEntries.some(
            (entry: LeaderboardEntry) => entry.userId === account.id
          );

          if (!isInTop50 && userRank) {
            // User is not in top 50, fetch users around them
            const aroundMeResponse = await leaderboardAPI.getAroundMe(1);
            usersAroundMe = aroundMeResponse.data.data.entries || [];

            // Find current user entry
            userEntry = usersAroundMe.find(
              (entry: LeaderboardEntry) => entry.userId === account.id
            ) || null;
          }
        } catch (userError) {
          // User might not have any XP yet, that's okay
          console.log('User not in leaderboard yet:', userError);
        }
      }

      setState({
        topEntries,
        userEntry,
        usersAroundMe,
        userRank,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load leaderboard. Please try again.',
      }));
    }
  }, [isAuthenticated, account]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    ...state,
    refresh: fetchLeaderboard,
  };
};
