"use client";

import { useState, useEffect } from "react";
import { MintButton } from "./MintButton";
import { RecentMints } from "./RecentMints";
import { nftAPI } from "@/lib/api";
import { Image, Hash } from "lucide-react";

interface NftMintingSectionProps {
  articleId: string;
  articleTitle: string;
  authorAddress: string;
}

export function NftMintingSection({ 
  articleId, 
  articleTitle, 
  authorAddress 
}: NftMintingSectionProps) {
  const [mintCount, setMintCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMintCount = async () => {
      try {
        setLoadingCount(true);
        const response = await nftAPI.getMintCount(articleId);
        
        // Handle the API response structure: { success: true, data: { articleId, count } }
        if (response.data.success && response.data.data?.count !== undefined) {
          setMintCount(response.data.data.count);
        } else {
          setMintCount(0);
        }
      } catch (error) {
        console.error("Error fetching mint count:", error);
        setMintCount(0);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchMintCount();
  }, [articleId, refreshKey]);

  const handleMintSuccess = () => {
    // Refresh the mint count and recent mints
    setRefreshKey(prev => prev + 1);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mint NFT</h2>
        <p className="text-sm text-gray-600">
          Mint this article as an NFT for permanent access and collectible ownership
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {loadingCount ? "..." : `${mintCount} minted`}
          </span>
          <span>by {formatAddress(authorAddress)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Mint Button */}
        <div className="space-y-4">
          {/* Article Preview */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex gap-4">
              {/* Placeholder Image */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Image className="w-6 h-6 text-gray-400" aria-label="Article placeholder image" />
              </div>
              
              {/* Article Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                  {articleTitle}
                </h3>
                <p className="text-xs text-gray-500">
                  Article NFT • Free Mint
                </p>
              </div>
            </div>
          </div>

          {/* Mint Button */}
          <MintButton 
            articleId={articleId}
            articleTitle={articleTitle}
            onMintSuccess={handleMintSuccess}
          />
        </div>

        {/* Right Column - Recent Mints */}
        <div>
          <RecentMints 
            articleId={articleId} 
            key={refreshKey} // Force refresh when mint succeeds
          />
        </div>
      </div>
    </div>
  );
}