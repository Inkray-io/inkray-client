"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiMedium } from "react-icons/si";
import { HiXMark } from "react-icons/hi2";
import { useImportWritingLink } from "@/hooks/useImportWritingLink";

const DISMISSED_KEY = "inkray-import-writing-banner-dismissed";

/**
 * Subtle, dismissible banner on the editor page nudging writers who already
 * publish elsewhere to import their existing posts. One-time (localStorage);
 * once dismissed it stays gone.
 */
export function ImportWritingBanner() {
  const importHref = useImportWritingLink();
  // Assume dismissed until we've read localStorage, so it never flashes in.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // non-fatal
    }
    setDismissed(true);
  };

  return (
    <div className="mx-auto max-w-[880px] px-5 sm:px-8 md:px-10 mb-3">
      <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5">
        <span className="flex-shrink-0 flex size-5 items-center justify-center rounded bg-gray-900">
          <SiMedium className="size-3 text-white" />
        </span>
        <p className="flex-1 min-w-0 text-[13px] text-gray-600">
          Already write on Medium?{" "}
          <Link
            href={importHref}
            className="font-medium text-primary hover:underline"
          >
            Import your posts
          </Link>{" "}
          instead of starting from scratch.
        </p>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Dismiss import suggestion"
          title="Dismiss"
        >
          <HiXMark className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
