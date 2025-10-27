"use client";

import { useState, useEffect } from "react";
import { MintButton } from "./MintButton";
import { VerificationSection } from "./VerificationSection";
import { nftAPI } from "@/lib/api";
import { Image } from "lucide-react";
import { log } from "@/lib/utils/Logger";

interface NftMintingSectionProps {
  articleId: string;
  articleTitle: string;
  authorAddress: string;
}

export function NftMintingSection({ 
  articleId, 
  articleTitle, 
  authorAddress: _authorAddress 
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
        log.error("Error fetching mint count", { error }, "NftMintingSection");
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

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Mint Button */}
        <div className="space-y-4">
          {/* Article Preview */}
          <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center">
            <Image className="w-16 h-16 text-gray-400" />
          </div>

          {/* Collection Description */}
          <div className="text-sm text-gray-500 text-center">
            Mint this entry as an NFT to add it to your collection.
          </div>

          {/* Mint Button */}
          <MintButton 
            articleId={articleId}
            articleTitle={articleTitle}
            onMintSuccess={handleMintSuccess}
          />

          {/* Collection Stats */}
          <div className="flex items-center justify-center gap-3">
            {/* Collector Avatars */}
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full border-2 border-white"></div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full border-2 border-white"></div>
            </div>
            
            {/* Collection Count */}
            <div className="text-xs text-gray-500">
              {loadingCount ? "..." : `${mintCount} collected`}
            </div>
          </div>
        </div>

        {/* Right Column - Verification */}
        <div>
          <VerificationSection 
            articleId={articleId}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}