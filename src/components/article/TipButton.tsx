"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { TipDialog } from "@/components/tipping/TipDialog";

interface TipButtonProps {
  publicationId: string;
  articleTitle: string;
  onTipSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TipButton({
  publicationId,
  articleTitle,
  onTipSuccess,
  isOpen,
  onOpenChange,
}: TipButtonProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Controlled when a parent passes `isOpen`, otherwise self-managed.
  const controlled = isOpen !== undefined;
  const dialogOpen = controlled ? isOpen : internalIsOpen;
  const setDialogOpen = onOpenChange ?? setInternalIsOpen;

  return (
    <>
      {/* No trigger in controlled mode — the parent owns opening. */}
      {!controlled && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setDialogOpen(true)}
        >
          <Heart className="w-4 h-4" />
          Tip Article
        </Button>
      )}

      <TipDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        publicationId={publicationId}
        supportLabel={`“${articleTitle}”`}
        recipientLabel="the writer"
        onTipSuccess={onTipSuccess}
      />
    </>
  );
}
