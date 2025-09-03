'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CommentFormProps {
  postId: string; // Keep as postId for backward compatibility
  parentId?: string;
  onCommentAdded: () => void;
  placeholder?: string;
}

export default function CommentForm({ 
  postId, 
  parentId, 
  onCommentAdded, 
  placeholder = "What are your thoughts?" 
}: CommentFormProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to comment');
        return;
      }

      const { error } = await supabase.from('comments').insert({
        cherry_id: postId, // Use cherry_id instead of post_id
        author_id: user.id,
        parent_id: parentId || null,
        body: body.trim()
      });

      if (error) throw error;

      setBody('');
      onCommentAdded();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={3}
            maxLength={1000}
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="mb-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {body.length}/1000
          </div>
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
