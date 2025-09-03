'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';
import CommentThread from '@/components/CommentThread';
import CommentForm from '@/components/CommentForm';

interface Post {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  community_id?: string;
  author_display_name: string;
  author_avatar?: string;
  community_slug?: string;
  community_name?: string;
  like_count: number;
  comment_count: number;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts_view')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) throw error;
        setPost(data);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleCommentAdded = () => {
    // Refresh the post to get updated comment count
    loadPost();
  };

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_view')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error refreshing post:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Post Not Found</h1>
          <p className="text-gray-400">The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Post */}
      <div className="mb-8">
        <PostCard post={post} showFullContent />
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">
          Comments ({post.comment_count})
        </h2>
        <CommentThread cherryId={postId} isVisible={true} onToggle={() => {}} />
      </div>
    </div>
  );
}
