"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout, RightSidebar } from "@/components/layout";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trophy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function LeaderboardPageContent() {
  const {
    topEntries,
    userEntry,
    usersAroundMe,
    userRank,
    isLoading,
    error,
    refresh,
  } = useLeaderboard();
  const { account } = useAuth();

  // Check if user is in top 50
  const isInTop50 = account
    ? topEntries.some((entry) => entry.userId === account.id)
    : false;

  const showUserSection = !isInTop50 && usersAroundMe.length > 0 && userEntry;

  return (
    <AppLayout
      currentPage="leaderboard"
      rightSidebar={
        <RightSidebar>
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-black">About Leaderboard</h3>
            </div>
            <p className="text-sm text-gray-600">
              The leaderboard ranks users based on their total XP earned from
              various activities on the platform.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Earn XP by:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Publishing articles</li>
                <li>Receiving tips</li>
                <li>Gaining followers</li>
                <li>Engaging with content</li>
              </ul>
            </div>
            {userRank && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">Your Rank</div>
                <div className="text-2xl font-bold text-primary">#{userRank}</div>
              </div>
            )}
          </div>
        </RightSidebar>
      }
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Leaderboard
              </h1>
              <p className="text-gray-600">
                Top contributors on the Inkray platform
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <p className="text-red-700">{error}</p>
              <Button onClick={refresh} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Top 50 Leaderboard */}
        {!error && (
          <>
            <div>
              <h2 className="text-xl font-bold text-black mb-3 px-2">
                Top 50 Contributors
              </h2>
              <LeaderboardTable
                entries={topEntries}
                currentUserId={account?.id}
                isLoading={isLoading}
              />
            </div>

            {/* User's Position (if not in top 50) */}
            {showUserSection && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="text-sm text-gray-500 font-medium">
                    Your Position
                  </span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                <LeaderboardTable
                  entries={usersAroundMe}
                  currentUserId={account?.id}
                  isLoading={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function LeaderboardPage() {
  return (
    <RequireAuth>
      <LeaderboardPageContent />
    </RequireAuth>
  );
}
