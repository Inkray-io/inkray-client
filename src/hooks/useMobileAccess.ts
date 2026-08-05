'use client';

import { useEffect, useState } from 'react';
import { mobileAccessAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface MobileAccess {
  eligible: boolean;
  url: string | null;
  loading: boolean;
}

/**
 * Checks whether the connected user qualifies for the private iOS beta. Only
 * calls the API when authenticated (the endpoint requires a connected account),
 * and the backend decides iOS from this request's User-Agent — so a non-iOS
 * visitor simply comes back not-eligible.
 */
export function useMobileAccess(): MobileAccess {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<MobileAccess>({
    eligible: false,
    url: null,
    loading: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setState({ eligible: false, url: null, loading: false });
      return;
    }
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
  }, [isAuthenticated, authLoading]);

  return state;
}
