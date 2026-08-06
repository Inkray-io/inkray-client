'use client';

import { useEffect, useState } from 'react';
import { mobileAccessAPI } from '@/lib/api';

interface MobileAccess {
  eligible: boolean;
  url: string | null;
  loading: boolean;
}

/**
 * Whether to show the mobile (TestFlight) beta banner. The only condition is that
 * the visitor is on an iOS device — no auth required — and the backend decides it
 * from this request's User-Agent, so a non-iOS visitor comes back not-eligible.
 */
export function useMobileAccess(): MobileAccess {
  const [state, setState] = useState<MobileAccess>({
    eligible: false,
    url: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await mobileAccessAPI.getEligibility();
        const data = res.data?.data ?? res.data;
        if (!cancelled) {
          setState({
            eligible: !!data?.eligible,
            url: data?.url ?? null,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ eligible: false, url: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
