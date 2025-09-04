"use client"

import { Button } from "@/components/ui/button"

interface SubscribeSectionProps {
  author: string
  description?: string
}

export function SubscribeSection({ author, description = "Receive the latest updates" }: SubscribeSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-black text-lg">
              Subscribe to {author}
            </h3>
            <p className="text-black/70 text-sm">
              {description}
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-semibold">
            Subscribe
          </Button>
        </div>
        
        {/* Rewards Section */}
        <div className="mt-6 pt-4 border-t border-black/10">
          <h4 className="font-medium text-black mb-2">Rewards</h4>
          <p className="text-sm text-black/60 mb-3">
            Copy your unique link below, share it and earn a reward every time this entity is minted.
          </p>
          
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-black/60 font-mono truncate">
                https://inkray.xyz/0Bg-dHsB-ZsQCNhiOgmZIxvI-wpjohpvhm1Ttx
              </span>
              <Button variant="outline" size="sm" className="ml-2">
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Two boxes side by side - Verification and Mint NFT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Verification Box (Left) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            <h5 className="font-medium text-black text-sm">Verification</h5>
            <p className="text-xs text-black/50">
              This entry has been permanently stored securely and cryptographically by multiple.
            </p>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-black/50">Available Transaction:</p>
                <p className="font-mono text-black/70">0x9897bf5d7c...Propjex1dhKqA1TBrp</p>
              </div>
              <div className="space-y-1">
                <p className="text-black/50">Immutable Transaction:</p>
                <p className="font-mono text-black/70">0x32dbd2e7bC...Propjex1dhKqA1TBrp</p>
              </div>
              <div className="space-y-1">
                <p className="text-black/50">Available Transaction:</p>
                <p className="font-mono text-black/70">0x32dbd2e7bC...Propjex1dhKqA1TBrp</p>
              </div>
              <div className="space-y-1">
                <p className="text-black/50">Immutable Transaction:</p>
                <p className="font-mono text-black/70">0x32dbd2e7bC...Propjex1dhKqA1TBrp</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mint NFT Box (Right) - NEW */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-black/70 leading-tight">
                  Mint this entry on an NFT to add it to your collection.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                      FREE
                    </span>
                  </div>
                  <p className="text-xs text-black/50">
                    Not connected
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Mint
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}