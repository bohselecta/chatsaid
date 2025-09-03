import { useState, useEffect, useCallback } from 'react';

export interface Cherry {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name?: string;
  author_avatar?: string;
  created_at: string;
  tags?: string[];
  simulated_activity?: boolean;
  bot_attribution?: string;
  engagement_score?: number;
  comment_count?: number;
  reaction_count?: number;
}

interface UseCanopyFeedOptions {
  sortBy?: string;
  contentFilter?: string;
  pageSize?: number;
}

interface UseCanopyFeedReturn {
  cherries: Cherry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export default function useCanopyFeed(options: UseCanopyFeedOptions = {}): UseCanopyFeedReturn {
  const { sortBy = 'mixed', contentFilter = 'all', pageSize = 20 } = options;
  
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchCherries = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        contentFilter
      });

      const response = await fetch(`/api/canopy/feed?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (append) {
        setCherries(prev => [...prev, ...data.cherries]);
      } else {
        setCherries(data.cherries);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cherries');
      console.error('Error fetching cherries:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, contentFilter, pageSize]);

  useEffect(() => {
    fetchCherries(0, false);
  }, [fetchCherries]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchCherries(page + 1, true);
    }
  }, [loading, hasMore, page, fetchCherries]);

  const refresh = useCallback(() => {
    fetchCherries(0, false);
  }, [fetchCherries]);

  return {
    cherries,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}
