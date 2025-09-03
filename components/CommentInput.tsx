'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SafetyDot from './SafetyDot';

interface CommentInputProps {
  cherryId: string;
  onCommentAdded: () => void;
}

export default function CommentInput({ cherryId, onCommentAdded }: CommentInputProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          cherry_id: cherryId,
          user_id: user.id,
          content: comment.trim(),
          parent_id: null
        });

      if (insertError) throw insertError;

      setComment('');
      onCommentAdded();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      setError(error.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={2}
            required
          />
          
          {/* Safety Dot for comments */}
          <div className="absolute bottom-2 right-2">
            <SafetyDot 
              content={comment} 
              contentType="comment"
              size="sm"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {comment.length}/1000 characters
          </div>
          
          <button
            type="submit"
            disabled={loading || !comment.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {loading ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}


