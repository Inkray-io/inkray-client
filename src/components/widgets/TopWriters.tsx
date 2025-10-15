"use client"

import { useTopWriters } from '@/hooks/useTopWriters';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface Writer {
  rank: number
  name: string
  subscribers: string
  avatar: string
  avatarConfig: {
    src: string | null;
    alt: string;
    fallbackText: string;
    gradientColors: string;
    size: 'md';
  };
}

interface TopWritersProps {
  writers?: Writer[]
}

export function TopWriters({ writers: propsWriters }: TopWritersProps) {
  const { writers: apiWriters, isLoading, error, refetch } = useTopWriters();

  // Use props writers if provided, otherwise use API data
  const displayWriters = propsWriters || apiWriters;

  // Loading state
  if (isLoading && displayWriters.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top writers</h3>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center gap-3">
              {/* Rank number skeleton */}
              <div className="w-6 text-center">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
              {/* Avatar skeleton */}
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              {/* Writer info skeleton */}
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="h-6 bg-gray-200 rounded animate-pulse mt-4 w-28"></div>
      </div>
    );
  }

  // Error state
  if (error && displayWriters.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top writers</h3>
        </div>
        
        <div className="text-center py-4 space-y-3">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Failed to load top writers</p>
          <button 
            onClick={refetch}
            className="text-[#005efc] hover:underline text-sm flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayWriters.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-black text-lg">Top writers</h3>
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No publications found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-black text-lg">Top writers</h3>
      </div>
      
      <div className="space-y-4">
        {displayWriters.map((writer) => (
          <div key={writer.rank} className="flex items-center gap-3">
            {/* Rank number */}
            <div className="w-6 text-center">
              <span className="text-black font-medium text-sm">
                {writer.rank}
              </span>
            </div>
            {/* Avatar */}
            <Avatar
              {...writer.avatarConfig}
            />
            {/* Writer info */}
            <div className="flex-1">
              <div className="font-semibold text-black text-sm">
                {writer.name}
              </div>
              <div className="text-gray-500 text-xs mt-0.5">
                {writer.subscribers}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-primary text-sm font-medium cursor-pointer hover:underline pt-4">
        View the entire list
      </div>
    </div>
  )
}