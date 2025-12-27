"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Info, Database, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlockchainInfoPopupProps {
  isOpen: boolean
  onClose: () => void
  articleId?: string
  walrusBlobId?: string
  network: 'testnet' | 'mainnet'
}

const truncateId = (id: string): string => {
  if (id.length <= 20) return id
  return `${id.slice(0, 8)}...${id.slice(-8)}`
}

export function BlockchainInfoPopup({
  isOpen,
  onClose,
  articleId,
  walrusBlobId,
  network,
}: BlockchainInfoPopupProps) {
  const suiExplorerUrl = articleId
    ? `https://suiscan.xyz/${network}/object/${articleId}`
    : null

  const walrusExplorerUrl = walrusBlobId
    ? `https://walruscan.com/${network}/blob/${walrusBlobId}`
    : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[360px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Blockchain Info
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Network Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Network</span>
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
              ${network === 'mainnet'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
              }
            `}>
              {network}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            This article is stored on Walrus decentralized storage and tracked on the Sui blockchain, ensuring permanent availability and verifiable ownership.
          </p>

          {/* Sui Object ID */}
          {articleId && (
            <div className="space-y-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Sui Object ID
              </span>
              <a
                href={suiExplorerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <Database className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-mono text-sm text-gray-700 truncate flex-1">
                  {truncateId(articleId)}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </a>
            </div>
          )}

          {/* Walrus Blob ID */}
          {walrusBlobId && (
            <div className="space-y-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Walrus Blob ID
              </span>
              <a
                href={walrusExplorerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-mono text-sm text-gray-700 truncate flex-1">
                  {truncateId(walrusBlobId)}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
