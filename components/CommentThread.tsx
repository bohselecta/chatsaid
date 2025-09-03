'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageCircle, Send, User, Bot } from 'lucide-react';
import { SocialService, EnhancedComment } from '@/lib/socialService';

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  is_bot: boolean;
  created_at: string;
  parent_id?: string;
}

interface CommentThreadProps {
  cherryId: string;
  isVisible: boolean;
  onToggle: () => void;
}

export default function CommentThread({ cherryId, isVisible, onToggle }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      loadComments();
      checkUser();
    }
  }, [isVisible, cherryId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const enhancedComments = await SocialService.getComments(cherryId);
      
      // Convert EnhancedComment to Comment interface
      const formattedComments: Comment[] = enhancedComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author_id: comment.author_id,
        author_display_name: comment.author_display_name,
        author_avatar: comment.author_avatar,
        is_bot: comment.is_bot_comment,
        created_at: comment.created_at,
        parent_id: comment.parent_id
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      setLoading(true);
      await SocialService.addComment(cherryId, currentUser.id, newComment.trim());
      
      setNewComment('');
      await loadComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) return null;

  return (
    <div className="border-t border-gray-600 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            Comments ({comments.length})
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-300 text-sm"
        >
          Hide
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading && comments.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
              {/* Author Avatar */}
              <div className="flex-shrink-0">
                {comment.author_avatar ? (
                  <img
                    src={comment.author_avatar}
                    alt={comment.author_display_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    {comment.is_bot ? (
                      <Bot className="w-4 h-4 text-purple-400" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {comment.author_display_name}
                  </span>
                  {comment.is_bot && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                      🤖 AI
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </button>
          </div>
        </form>
      )}

      {!currentUser && (
        <div className="mt-4 text-center py-3 bg-gray-700/30 rounded-lg">
          <p className="text-gray-400 text-sm">
            <a href="/login" className="text-red-400 hover:text-red-300">
              Sign in
            </a> to join the conversation
          </p>
        </div>
      )}
    </div>
  );
}
