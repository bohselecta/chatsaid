'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Post = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name: string | null;
};

export default function PostItem({ post, onLike }: { post: Post; onLike?: () => void }) {
  const [liking, setLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Check if current user has liked this post
  useEffect(() => {
    checkLikeStatus();
    getLikeCount();
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

  const getLikeCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    
    setLikeCount(count || 0);
  };

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please log in.");

    setLiking(true);
    
    try {
      if (isLiked) {
        // Unlike: remove the like
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
        
        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like: add the like
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, post_id: post.id });
        
        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Like error:', error);
      alert(error.message || 'Failed to update like');
    } finally {
      setLiking(false);
    }
  };

  return (
    <article className="rounded-lg bg-white/5 p-3 mb-3">
      <div className="text-sm opacity-70">
        {post.author_display_name ?? "anon"} • {new Date(post.created_at).toLocaleString()}
      </div>
      <p className="mt-1 text-base leading-relaxed">{post.body}</p>
      <div className="mt-2 flex items-center gap-3">
        <button 
          onClick={toggleLike} 
          disabled={liking} 
          className={`text-sm px-2 py-1 rounded transition-colors ${
            isLiked 
              ? 'bg-[var(--accent)] text-white' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {isLiked ? '🍒 Liked' : '🍒 Like'}
        </button>
        <span className="text-sm opacity-70">{likeCount} like{likeCount !== 1 ? 's' : ''}</span>
      </div>
    </article>
  );
}
