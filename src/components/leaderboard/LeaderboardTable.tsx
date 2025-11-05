"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/hooks/useLeaderboard";
import { Trophy } from "lucide-react";
import { formatAddress } from "@/utils/address";
import { createUserAvatarConfig } from "@/lib/utils/avatar";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

const getMedalEmoji = (rank: number): string | null => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return null;
  }
};

const formatXP = (xp: number): string => {
  return xp.toLocaleString();
};

const LeaderboardRow = ({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) => {
  const medal = getMedalEmoji(entry.rank);

  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors",
        isCurrentUser
          ? "bg-blue-50 border-2 border-primary"
          : "hover:bg-gray-50",
      )}
    >
      {/* Rank */}
      <div className="w-10 sm:w-12 flex-shrink-0 text-center">
        {medal ? (
          <span className="text-2xl sm:text-3xl">{medal}</span>
        ) : (
          <span className="text-base sm:text-lg font-bold text-gray-600">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar
        {...createUserAvatarConfig({
          id: entry.userId,
          publicKey: entry.publicKey,
          name: entry.username,
          avatar: entry.avatar,
        }, 'md')}
        className="flex-shrink-0"
      />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "font-semibold truncate",
              isCurrentUser ? "text-primary" : "text-black",
            )}
          >
            {entry.username || formatAddress(entry.publicKey)}
          </div>
          {isCurrentUser && (
            <span className="px-2 py-0.5 text-xs font-bold text-primary bg-primary/10 rounded">
              YOU
            </span>
          )}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 truncate">
          {formatAddress(entry.publicKey)}
        </div>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-primary text-base sm:text-lg">
          {formatXP(entry.totalXP)}
        </div>
        <div className="text-xs text-gray-500">XP</div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <Skeleton className="w-12 h-8" />
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

export const LeaderboardTable = ({
  entries,
  currentUserId,
  isLoading = false,
}: LeaderboardTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No leaderboard entries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6">
      <div className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            isCurrentUser={entry.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  );
};
