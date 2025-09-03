'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LikeCherryButton({ 
  postId, 
  initialLiked = false, 
  initialCount = 0, 
  onToggle 
}: {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onToggle?: (liked: boolean) => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newLiked = !liked;
    
    // Optimistic update
    setLiked(newLiked);
    setCount((c) => newLiked ? c + 1 : Math.max(0, c - 1));
    onToggle?.(newLiked);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      
      if (newLiked) {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      } else {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      }
    } catch (err) {
      // Rollback on error
      setLiked(!newLiked);
      setCount((c) => newLiked ? Math.max(0, c - 1) : c + 1);
      console.error('Like error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={liked ? "true" : "false"}
      aria-label={liked ? 'Unlike post' : 'Like post'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
        liked 
          ? 'bg-[var(--accent)] text-white shadow-lg' 
          : 'bg-white/5 text-[var(--fg)] hover:bg-white/10'
      } ${liked ? 'pop-anim' : ''}`}
    >
      <span className="sr-only">{liked ? 'Liked' : 'Like'}</span>
      <span className="text-lg">
        {liked ? '🍒' : '🍒'}
      </span>
      <span>{liked ? 'Liked' : 'Like'}</span>
      {count > 0 && (
        <span className="text-[var(--muted)] ml-1 font-normal">
          {count}
        </span>
      )}
    </button>
  );
}
