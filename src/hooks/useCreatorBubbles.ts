'use client';

import { useState, useEffect, useCallback } from 'react';
import { publicationsAPI } from '@/lib/api';

export interface CreatorBubble {
  id: string; // publication address
  name: string;
  avatar: string | null;
  isVerified: boolean;
  score: number;
  articles: number;
  avgQuality: number;
  engagement: number;
  followers: number;
  views: number;
}

interface UseCreatorBubblesReturn {
  bubbles: CreatorBubble[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCreatorBubbles(limit = 80): UseCreatorBubblesReturn {
  const [bubbles, setBubbles] = useState<CreatorBubble[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await publicationsAPI.getBubbleMap(limit);
      const data = res.data?.data ?? res.data;
      setBubbles(data?.bubbles ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load creators');
      setBubbles([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { bubbles, isLoading, error, refetch: load };
}
