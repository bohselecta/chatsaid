'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CherryCard from './CherryCard';

interface Cherry {
  id: string;
  title?: string;
  content: string;
  privacy_level: 'private' | 'friends' | 'public';
  tags?: string[];
  source_file?: string;
  line_number?: number;
  image_url?: string;
  review_status: string;
  is_featured: boolean;
  created_at: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  like_count: number;
  comment_count: number;
}

interface CherryFeedClientProps {
  communityId?: string;
  title?: string;
  showPrivate?: boolean;
  showFriends?: boolean;
  showPublic?: boolean;
  branchType?: string;
  twigSlug?: string;
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
}

export interface CherryFeedClientRef {
  refresh: () => void;
}

const CherryFeedClient = forwardRef<CherryFeedClientRef, CherryFeedClientProps>(({
  communityId,
  title = 'Cherries',
  showPrivate = false,
  showFriends = true,
  showPublic = true,
  branchType,
  twigSlug,
  sortBy = 'newest'
}, ref) => {
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);


  const ITEMS_PER_PAGE = 10;

  useImperativeHandle(ref, () => ({
    refresh: () => {
      setPage(0);
      setCherries([]);
      setHasMore(true);
      fetchCherries();
    }
  }));

  useEffect(() => {
    checkUserAndLoadCherries();
  }, [communityId, branchType, twigSlug, sortBy, showPrivate, showFriends, showPublic]);

  const checkUserAndLoadCherries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        await fetchCherries();
      } else {
        // If no user, only show public cherries
        await fetchPublicCherries();
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Failed to authenticate user');
      setLoading(false);
    }
  };

  const fetchCherries = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cherries_view')
        .select('*');

      // Apply privacy filters
      if (currentUser) {
        const privacyLevels = [];
        if (showPrivate) privacyLevels.push('private');
        if (showFriends) privacyLevels.push('friends');
        if (showPublic) privacyLevels.push('public');

        if (privacyLevels.length > 0) {
          query = query.in('privacy_level', privacyLevels);
        }

        // For private cherries, only show user's own
        if (showPrivate) {
          query = query.eq('author_id', currentUser.id);
        }

        // For friends-only cherries, check friendship status
        if (showFriends && !showPrivate) {
          // This is a simplified approach - in production you'd want to use a more efficient query
          const { data: friendships } = await supabase
            .from('friendships')
            .select('addressee_id, requester_id')
            .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
            .eq('status', 'accepted');

          if (friendships && friendships.length > 0) {
            const friendIds = friendships.map(f => 
              f.requester_id === currentUser.id ? f.addressee_id : f.requester_id
            );
            friendIds.push(currentUser.id); // Include user's own cherries
            query = query.in('author_id', friendIds);
          } else {
            // No friends, only show user's own cherries
            query = query.eq('author_id', currentUser.id);
          }
        }
      } else {
        // No user logged in, only show public cherries
        query = query.eq('privacy_level', 'public');
      }

      // Apply community filters
      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      if (branchType) {
        // Filter by branch type through cherry_branches table
        const { data: branchCherries } = await supabase
          .from('cherry_branches')
          .select('cherry_id')
          .eq('branch_type', branchType);

        if (branchCherries && branchCherries.length > 0) {
          const cherryIds = branchCherries.map(bc => bc.cherry_id);
          query = query.in('id', cherryIds);
        }
      }

      if (twigSlug) {
        // Filter by twig slug through cherry_branches table
        const { data: twigCherries } = await supabase
          .from('cherry_branches')
          .select('cherry_id')
          .eq('twig_slug', twigSlug);

        if (twigCherries && twigCherries.length > 0) {
          const cherryIds = twigCherries.map(tc => tc.cherry_id);
          query = query.in('id', cherryIds);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('like_count', { ascending: false });
          break;
        case 'most_commented':
          query = query.order('comment_count', { ascending: false });
          break;
        default: // newest
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        if (page === 0) {
          setCherries(data);
        } else {
          setCherries(prev => [...prev, ...data]);
        }
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching cherries:', error);
      setError('Failed to load cherries');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicCherries = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('public_cherries_view')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      // Apply community filters
      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      if (branchType) {
        // Filter by branch type through cherry_branches table
        const { data: branchCherries } = await supabase
          .from('cherry_branches')
          .select('cherry_id')
          .eq('branch_type', branchType);

        if (branchCherries && branchCherries.length > 0) {
          const cherryIds = branchCherries.map(bc => bc.cherry_id);
          query = query.in('id', cherryIds);
        }
      }

      if (twigSlug) {
        // Filter by twig slug through cherry_branches table
        const { data: twigCherries } = await supabase
          .from('cherry_branches')
          .select('cherry_id')
          .eq('twig_slug', twigSlug);

        if (twigCherries && twigCherries.length > 0) {
          const cherryIds = twigCherries.map(tc => tc.cherry_id);
          query = query.in('id', cherryIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        if (page === 0) {
          setCherries(data);
        } else {
          setCherries(prev => [...prev, ...data]);
        }
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching public cherries:', error);
      setError('Failed to load cherries');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      if (currentUser) {
        fetchCherries();
      } else {
        fetchPublicCherries();
      }
    }
  };

  const handleCherryUpdated = () => {
    // Refresh the feed when a cherry is updated
    setPage(0);
    setCherries([]);
    setHasMore(true);
    if (currentUser) {
      fetchCherries();
    } else {
      fetchPublicCherries();
    }
  };

  if (loading && cherries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading cherries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 text-lg mb-2">⚠️</div>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={() => {
            setError(null);
            if (currentUser) {
              fetchCherries();
            } else {
              fetchPublicCherries();
            }
          }}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cherries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-lg mb-2">🍒</div>
        <p className="text-gray-400">No cherries found</p>
        {currentUser && (
          <p className="text-gray-500 text-sm mt-2">
            {showPrivate ? 'Create your first private cherry!' : 
             showFriends ? 'No friends have shared cherries yet' : 
             'No public cherries available'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="text-sm text-gray-400">
          {cherries.length} cherry{cherries.length !== 1 ? 'ies' : ''}
        </div>
      </div>

      {/* Cherries */}
      <div className="space-y-4">
        {cherries.map((cherry) => (
          <CherryCard
            key={cherry.id}
            cherry={cherry}
            branch={{
              name: 'General',
              slug: 'general',
              color: '#6B7280',
              icon: '🍒'
            }}
            isOpen={true}
            onClose={() => {}}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Cherries'}
          </button>
        </div>
      )}
    </div>
  );
});

CherryFeedClient.displayName = 'CherryFeedClient';

export default CherryFeedClient;
