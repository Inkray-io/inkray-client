"use client";

import { useEffect, useState } from "react";
import { getCachedPublication } from "@/lib/cache-manager";
import { ROUTES } from "@/constants/routes";

/**
 * Deep-link to the "Import your writing" surface (Medium / RSS import, which
 * lives in publication settings) for the current user's publication.
 *
 * Reads the local publication cache — no network — so it's cheap to call from
 * discovery hooks (empty states, banners, onboarding). Resolves after mount to
 * stay SSR-safe. Falls back to publication creation when the user doesn't have
 * a publication yet, so the hook never dead-ends.
 */
export function useImportWritingLink(): string {
  const [href, setHref] = useState<string>(ROUTES.CREATE_PUBLICATION);

  useEffect(() => {
    const pub = getCachedPublication();
    setHref(
      pub?.publicationId
        ? ROUTES.PUBLICATION_SETTINGS(pub.publicationId, "rss-feeds")
        : ROUTES.CREATE_PUBLICATION,
    );
  }, []);

  return href;
}
