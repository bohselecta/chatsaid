'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FileText } from 'lucide-react';
import CommentForm from '@/components/CommentForm';
import CommentThread from '@/components/CommentThread';

interface Cherry {
  id: string;
  title: string;
  content: string;
  privacy_level: 'private' | 'friends' | 'public';
  tags: string[] | null;
  source_file: string | null;
  line_number: number | null;
  image_url: string | null;
  review_status: string;
  is_featured: boolean;
  created_at: string;
  author_id: string;
  author_display_name: string;
  author_avatar: string | null;
  like_count: number;
  comment_count: number;
}

export default function CherryDetailPage() {
  const [cherry, setCherry] = useState<Cherry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const params = useParams();
  const cherryId = params.id as string;


  useEffect(() => {
    checkUserAndLoadCherry();
  }, [cherryId]);

  const checkUserAndLoadCherry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      await loadCherry();
    } catch (error) {
      console.error('Error checking user:', error);
      await loadCherry();
    }
  };

  const loadCherry = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cherries_view')
        .select('*')
        .eq('id', cherryId)
        .single();

      if (error) throw error;

      // Check privacy access
      if (data.privacy_level === 'private' && (!currentUser || data.author_id !== currentUser.id)) {
        setError('This cherry is private and you do not have access to view it.');
        setLoading(false);
        return;
      }

      if (data.privacy_level === 'friends' && currentUser) {
        // Check if user is friends with the author
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
          .eq('status', 'accepted')
          .or(`requester_id.eq.${data.author_id},addressee_id.eq.${data.author_id}`)
          .single();

        if (!friendship && data.author_id !== currentUser.id) {
          setError('This cherry is only visible to friends of the author.');
          setLoading(false);
          return;
        }
      }

      setCherry(data);
    } catch (error) {
      console.error('Error loading cherry:', error);
      setError('Failed to load cherry');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    // Refresh cherry data (like comment count)
    loadCherry();
  };

  const handleCherryUpdated = () => {
    loadCherry(); // Refresh cherry data
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 text-lg mb-6">{error}</p>
          <a
            href="/canopy"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Canopy
          </a>
        </div>
      </div>
    );
  }

  if (!cherry) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Cherry Not Found</h1>
          <p className="text-gray-400 text-lg mb-6">
            The cherry you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/canopy"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Canopy
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Cherry Detail */}
      <div className="mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <div className="flex items-start gap-4">
            {/* Author Info */}
            <div className="flex-shrink-0">
              {cherry.author_avatar ? (
                <img 
                  src={cherry.author_avatar} 
                  alt={cherry.author_display_name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">👤</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-white">{cherry.title || 'Untitled Cherry'}</h1>
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                  {cherry.privacy_level}
                </span>
              </div>
              
              <div className="text-gray-400 text-sm mb-3">
                by {cherry.author_display_name} • {new Date(cherry.created_at).toLocaleDateString()}
              </div>
              
              <div className="text-gray-200 mb-4 whitespace-pre-wrap">{cherry.content}</div>
              
              {/* Source Info */}
              {cherry.source_file && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <FileText className="w-4 h-4" />
                  <span>{cherry.source_file}</span>
                  {cherry.line_number && <span>• Line {cherry.line_number}</span>}
                </div>
              )}
              
              {/* Tags */}
              {cherry.tags && cherry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {cherry.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>❤️ {cherry.like_count}</span>
                <span>💬 {cherry.comment_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h2 className="text-xl font-semibold text-white mb-6">
          💬 Comments ({cherry.comment_count})
        </h2>

        {/* Comment Form */}
        {currentUser && (
          <div className="mb-8">
            <CommentForm
              postId={cherry.id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        )}

        {/* Comment Thread */}
        <CommentThread
          cherryId={cherry.id}
          isVisible={true}
          onToggle={() => {}}
        />
      </div>
    </div>
  );
}
