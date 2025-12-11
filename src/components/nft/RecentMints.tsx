"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { nftAPI } from "@/lib/api";
import { Clock, ExternalLink } from "lucide-react";
import { log } from "@/lib/utils/Logger";
import { ROUTES } from "@/constants/routes";

interface MintTransaction {
  id: string;
  nftId: string;
  to: string;
  pricePaid: string;
  transactionHash: string;
  mintedAt: string;
}

interface RecentMintsProps {
  articleId: string;
}

export function RecentMints({ articleId }: RecentMintsProps) {
  const router = useRouter();
  const [mints, setMints] = useState<MintTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentMints = async () => {
      try {
        setLoading(true);
        const response = await nftAPI.getRecentMints(articleId, 4);

        // Handle the API response structure: { success: true, data: { data: mints, total: count } }
        if (response.data.success && response.data.data?.data) {
          setMints(response.data.data.data);
        } else {
          setMints([]);
        }
      } catch (err) {
        setError("Failed to load recent mints");
        log.error("Error fetching recent mints", { error: err }, "RecentMints");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMints();
  }, [articleId]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const mintDate = new Date(date);
    const diffMs = now.getTime() - mintDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Recent Mints</h3>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Recent Mints</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Recent Mints</h3>
      
      {mints.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No mints yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to mint this article!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mints.map((mint) => (
            <div 
              key={mint.id} 
              className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.PROFILE_WITH_ID(mint.to))}
                  className="text-sm font-medium text-gray-900 hover:text-primary hover:underline transition-colors"
                >
                  {formatAddress(mint.to)}
                </button>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(mint.mintedAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  NFT: {formatAddress(mint.nftId)}
                </span>
                <button
                  onClick={() => window.open(`https://suiexplorer.com/object/${mint.nftId}?network=testnet`, '_blank')}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View NFT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}