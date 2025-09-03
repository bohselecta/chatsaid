'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';

interface Post {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name: string | null;
  author_avatar?: string;
  community_slug?: string;
  community_name?: string;
  branch_type?: string;
  twig_slug?: string;
  twig_name?: string;
  like_count?: number;
  comment_count?: number;
  is_featured?: boolean;
  review_status?: string;
}

interface Twig {
  id: string;
  name: string;
  slug: string;
  description: string;
  member_count: number;
  post_count: number;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_type: string;
  member_count: number;
  post_count: number;
}

type SortOption = 'new' | 'hot' | 'top' | 'featured';

export default function BranchPage() {
  const params = useParams();
  const branchType = params.type as string;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [twigs, setTwigs] = useState<Twig[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('new');
  const [selectedTwig, setSelectedTwig] = useState<string>('all');

  useEffect(() => {
    if (branchType) {
      loadBranch();
      loadTwigs();
      loadPosts();
    }
  }, [branchType, sortBy, selectedTwig]);

  const loadBranch = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('branch_type', branchType)
        .eq('is_primary_branch', true)
        .single();

      if (error) throw error;
      setBranch(data);
    } catch (err) {
      console.error('Error loading branch:', err);
    }
  };

  const loadTwigs = async () => {
    try {
      const { data, error } = await supabase
        .from('twigs')
        .select('*')
        .eq('branch_id', (await supabase.from('communities').select('id').eq('branch_type', branchType).eq('is_primary_branch', true).single()).data?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTwigs(data || []);
    } catch (err) {
      console.error('Error loading twigs:', err);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('posts_view')
        .select('*')
        .eq('branch_type', branchType)
        .eq('review_status', 'approved');

      // Filter by twig if selected
      if (selectedTwig !== 'all') {
        query = query.eq('twig_slug', selectedTwig);
      }

      // Apply sorting
      switch (sortBy) {
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'hot':
          query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'top':
          query = query.order('like_count', { ascending: false });
          break;
        case 'featured':
          query = query.eq('is_featured', true).order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const getSortIcon = (sort: SortOption) => {
    switch (sort) {
      case 'new': return '🕐';
      case 'hot': return '🔥';
      case 'top': return '⭐';
      case 'featured': return '⭐';
      default: return '🕐';
    }
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'new': return 'New';
      case 'hot': return 'Hot';
      case 'top': return 'Top';
      case 'featured': return 'Featured';
      default: return 'New';
    }
  };

  const getBranchIcon = (type: string) => {
    switch (type) {
      case 'funny': return '😄';
      case 'mystical': return '✨';
      case 'technical': return '⚡';
      case 'research': return '🔬';
      case 'ideas': return '💡';
      default: return '🌿';
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-[var(--card)] rounded-xl mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-[var(--card)] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--fg)] mb-4">
            Branch Not Found
          </h1>
          <p className="text-[var(--muted)]">
            This branch could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Branch Header */}
      <div className="bg-[var(--card)] rounded-xl p-6 mb-6 shadow-card border border-white/5">
        <div className="text-center">
          <div className="text-6xl mb-4">{getBranchIcon(branch.branch_type)}</div>
          <h1 className="text-4xl font-bold text-[var(--fg)] mb-2">
            {branch.name}
          </h1>
          <p className="text-[var(--muted)] text-lg mb-4">
            {branch.description}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>{branch.member_count} members</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span>{branch.post_count} cherries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Twigs Section */}
      {twigs.length > 0 && (
        <div className="bg-[var(--card)] rounded-xl p-4 mb-6 shadow-card border border-white/5">
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">Twigs in this Branch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {twigs.map((twig) => (
              <button
                key={twig.id}
                onClick={() => setSelectedTwig(selectedTwig === twig.slug ? 'all' : twig.slug)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedTwig === twig.slug
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-white/5 text-[var(--fg)] hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{twig.name}</div>
                <div className="text-xs opacity-75 mt-1">{twig.description}</div>
                <div className="text-xs opacity-75 mt-2">
                  {twig.post_count} cherries • {twig.member_count} members
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="bg-[var(--card)] rounded-xl p-4 mb-6 shadow-card border border-white/5">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Twig Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--fg)]">Twig:</label>
            <select
              value={selectedTwig}
              onChange={(e) => setSelectedTwig(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Select twig to filter by"
            >
              <option value="all">All Twigs</option>
              {twigs.map((twig) => (
                <option key={twig.slug} value={twig.slug}>
                  {twig.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            {(['new', 'hot', 'top', 'featured'] as SortOption[]).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === sort
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-white/5 text-[var(--fg)] hover:bg-white/10'
                }`}
              >
                {getSortIcon(sort)}
                {getSortLabel(sort)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍒</div>
          <p className="text-[var(--muted)] text-lg">
            No cherries found in this {selectedTwig !== 'all' ? 'twig' : 'branch'} yet.
          </p>
          <p className="text-[var(--muted)] text-sm mt-2">
            Be the first to post something amazing!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {posts.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadPosts}
            className="px-6 py-3 bg-white/5 text-[var(--fg)] rounded-lg hover:bg-white/10 transition-colors font-medium"
          >
            Load More Cherries
          </button>
        </div>
      )}
    </div>
  );
}
