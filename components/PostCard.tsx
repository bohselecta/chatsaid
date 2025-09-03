'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LikeCherryButton from "./LikeCherryButton";

type Post = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name: string | null;
  author_avatar?: string;
  community_slug?: string;
  like_count?: number;
  comment_count?: number;
};

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  showFullContent?: boolean;
}

export default function PostCard({ post, onLike, showFullContent = false }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  // Check if current user has liked this post
  useEffect(() => {
    checkLikeStatus();
  }, [post.id]);

  const checkLikeStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("post_id", post.id)
      .single();
    
    setIsLiked(!!data);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return postDate.toLocaleDateString();
  };

  const handleLikeToggle = (liked: boolean) => {
    setIsLiked(liked);
    setLikeCount(liked ? likeCount + 1 : Math.max(0, likeCount - 1));
    onLike?.();
  };

  const handleCommentClick = () => {
    if (!showFullContent) {
      router.push(`/post/${post.id}`);
    }
  };

  const handlePostClick = () => {
    if (!showFullContent) {
      router.push(`/post/${post.id}`);
    }
  };

  return (
    <article className="bg-[var(--card)] rounded-xl p-4 mb-4 shadow-card border border-white/5">
      {/* Post Header */}
      <header className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm">
          {post.author_avatar ? (
            <img 
              src={post.author_avatar} 
              alt={`${post.author_display_name || 'User'} avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            (post.author_display_name?.[0] || 'U').toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <a 
              href={`/profile/${post.author_id}`}
              className="font-semibold text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
            >
              {post.author_display_name || 'Anonymous'}
            </a>
            
            {post.community_slug && (
              <>
                <span className="text-[var(--muted)]">•</span>
                <a 
                  href={`/c/${post.community_slug}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  c/{post.community_slug}
                </a>
              </>
            )}
            
            <span className="text-[var(--muted)]">•</span>
            <time 
              dateTime={post.created_at}
              className="text-[var(--muted)]"
            >
              {formatTimeAgo(post.created_at)}
            </time>
          </div>
        </div>
      </header>

      {/* Post Body */}
      <div className={`mb-4 ${!showFullContent ? 'cursor-pointer' : ''}`} onClick={handlePostClick}>
        <p className="text-base leading-relaxed text-[var(--fg)] whitespace-pre-wrap">
          {post.body}
        </p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center gap-4 text-sm">
        <LikeCherryButton
          postId={post.id}
          initialLiked={isLiked}
          initialCount={likeCount}
          onToggle={handleLikeToggle}
        />
        
        <button 
          onClick={handleCommentClick}
          className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          aria-label="Comment on post"
        >
          💬 Comment
          {post.comment_count ? (
            <span className="ml-2 text-[var(--muted)]">
              {post.comment_count}
            </span>
          ) : null}
        </button>
        
        <button 
          className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          aria-label="Share post"
        >
          📤 Share
        </button>
        
        <button 
          className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 ml-auto"
          aria-label="Save post"
        >
          🔖 Save
        </button>
      </div>
    </article>
  );
}
