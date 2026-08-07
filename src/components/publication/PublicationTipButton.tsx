"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { TipDialog } from "@/components/tipping/TipDialog";

interface PublicationTipButtonProps {
  publicationId: string;
  publicationName: string;
  onTipSuccess?: () => void;
}

export function PublicationTipButton({
  publicationId,
  publicationName,
  onTipSuccess,
}: PublicationTipButtonProps) {
  const { isConnected } = useWalletConnection();
  const [isOpen, setIsOpen] = useState(false);

  // Anonymous / not-connected visitors can't tip — hide the action entirely
  // rather than dropping a bare "Connect wallet" button into the header.
  if (!isConnected) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-all duration-200 hover:bg-red-100"
      >
        <Heart className="w-3 h-3" />
        Tip
      </button>

      <TipDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        publicationId={publicationId}
        supportLabel={`“${publicationName}”`}
        recipientLabel="this publication"
        onTipSuccess={onTipSuccess}
      />
    </>
  );
}
