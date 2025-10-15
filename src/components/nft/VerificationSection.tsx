"use client";

interface VerificationSectionProps {
  articleId: string;
}

export function VerificationSection({ articleId }: VerificationSectionProps) {
  // Mock Arweave transaction data - in real implementation this would come from API
  const arweaveTransactions = [
    "drN98zM7FpVDPWO...KNgeobSJWu8YR9g",
    "drN98zM7FpVDPWO...KNgeobSJWu8YR9g", 
    "drN98zM7FpVDPWO...KNgeobSJWu8YR9g",
    "drN98zM7FpVDPWO...KNgeobSJWu8YR9g"
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Verification</h3>
      
      <p className="text-xs text-gray-500">
        This entry has been permanently stored onchain and signed by its creator.
      </p>

      <div className="space-y-3">
        {arweaveTransactions.map((hash, index) => (
          <div key={index} className="space-y-1">
            <div className="text-xs text-gray-500">
              Arweave Transaction
            </div>
            <div className="text-xs font-mono text-gray-500">
              {hash}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}