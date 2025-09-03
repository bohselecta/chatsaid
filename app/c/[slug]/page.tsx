'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostComposer from '@/components/PostComposer';
import FeedClient from '@/components/FeedClient';
import CommunityHeader from '@/components/CommunityHeader';

type Community = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  created_by?: string;
};

type Post = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name: string | null;
  author_avatar?: string;
  community_slug?: string;
  community_name?: string;
  like_count?: number;
  comment_count?: number;
};

type CommunityPageProps = {
  params: { slug: string };
};

export default function CommunityPage({ params }: CommunityPageProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityData();
  }, [params.slug]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (communityError || !communityData) {
        setError('Community not found');
        return;
      }

      setCommunity(communityData);

      // Load community posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts_view')
        .select('*')
        .eq('community_id', communityData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error fetching community posts:', postsError);
        setError('Failed to load posts');
      } else {
        setPosts(postsData || []);
      }
    } catch (err) {
      console.error('Exception loading community data:', err);
      setError('Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          <p className="mt-4 text-[var(--muted)]">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-red-400 mb-2">Error loading community</p>
          <p className="text-[var(--muted)] text-sm mb-4">{error}</p>
          <button 
            onClick={loadCommunityData}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <CommunityHeader community={community} />
      
      <PostComposer communityId={community.id} />
      
      <FeedClient 
        initialPosts={posts}
        communityId={community.id}
        title={`Posts in ${community.name}`}
      />
    </div>
  );
}
