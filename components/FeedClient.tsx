'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "./PostCard";

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

type FeedClientProps = {
  initialPosts?: Post[];
  communityId?: string;
  title?: string;
};

export interface FeedClientRef {
  refresh: () => void;
}

const FeedClient = forwardRef<FeedClientRef, FeedClientProps>(
  ({ initialPosts = [], communityId, title }, ref) => {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (initialPosts.length === 0) {
        load();
      }
    }, [communityId]);

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("posts_view")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (communityId) {
          query = query.eq("community_id", communityId);
        }

        const { data, error } = await query;

        if (error) {
          setError(error.message);
        } else {
          setPosts(data || []);
        }
      } catch (err) {
        setError("Failed to load posts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // Expose refresh function to parent components
    useImperativeHandle(ref, () => ({
      refresh: load
    }));

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          <p className="mt-4 text-[var(--muted)]">Loading posts...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-red-400 mb-2">Error loading posts</p>
          <p className="text-[var(--muted)] text-sm">{error}</p>
          <button 
            onClick={load}
            className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-[var(--muted)] text-6xl mb-4">🍒</div>
          <h3 className="text-xl font-semibold mb-2">
            {title || 'No posts yet'}
          </h3>
          <p className="text-[var(--muted)]">
            {communityId 
              ? 'Be the first to post in this community!' 
              : 'Be the first to share something amazing!'
            }
          </p>
        </div>
      );
    }

    return (
      <div>
        {title && (
          <h2 className="text-2xl font-semibold text-[var(--fg)] mb-6">
            {title}
          </h2>
        )}
        
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={load} />
          ))}
        </div>
      </div>
    );
  }
);

FeedClient.displayName = 'FeedClient';

export default FeedClient;
