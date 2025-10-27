"use client";

import { RecentMints } from './RecentMints';

interface VerificationSectionProps {
  articleId: string;
  refreshKey?: number;
}

export function VerificationSection({ articleId, refreshKey }: VerificationSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Verification</h3>
      
      <p className="text-xs text-gray-500">
        This entry has been permanently stored onchain and signed by its creator.
      </p>

      <RecentMints articleId={articleId} refreshKey={refreshKey} />
    </div>
  );
}