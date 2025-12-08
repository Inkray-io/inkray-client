import { useCallback, useEffect, useState } from 'react';
import { draftsAPI } from '@/lib/api';
import { DraftArticle, PaginatedDraftArticles } from '@/types/article';
import { log } from '@/lib/utils/Logger';

export function useDrafts(initialPage = 1, initialLimit = 20) {
  const [drafts, setDrafts] = useState<DraftArticle[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [limit] = useState<number>(initialLimit);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [total, setTotal] = useState<number | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const resp = await draftsAPI.listArticles(p, limit);
      const payload: PaginatedDraftArticles = resp.data.data as PaginatedDraftArticles;
      console.log('Fetched drafts payload:', payload);
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const totalVal = typeof payload?.total === 'number' ? payload.total : null;

      // Compute hasMore from page/limit/total
      const hasMoreVal = typeof totalVal === 'number'
        ? (payload.page * payload.limit) < totalVal
        : (list.length === limit);

      if (p === initialPage) {
        setDrafts(list);
      } else {
        setDrafts(prev => [...prev, ...list]);
      }

      setTotal(totalVal);
      setHasMore(Boolean(hasMoreVal));
    } catch (err) {
      log.error('useDrafts fetch error', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [initialPage, limit]);

  useEffect(() => {
    void fetchPage(page);
  }, [page, fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setPage(p => p + 1);
  }, [isLoading, hasMore]);

  const refresh = useCallback(async () => {
    setPage(initialPage);
    setDrafts([]);
  }, [initialPage]);

  return {
    drafts,
    isLoading,
    error,
    page,
    limit,
    total,
    hasMore,
    loadMore,
    refresh,
    setPage,
  };
}
