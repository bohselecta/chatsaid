'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CreateCommunityModal from './CreateCommunityModal';

type Community = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  created_by?: string;
};

type CommunityHeaderProps = {
  community: Community;
};

export default function CommunityHeader({ community }: CommunityHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  // Load community stats
  useEffect(() => {
    loadCommunityStats();
  }, [community.id]);

  const loadCommunityStats = async () => {
    try {
      // Get post count
      const { count: posts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      // Get member count (users who have posted in this community)
      const { data: members } = await supabase
        .from('posts')
        .select('author_id')
        .eq('community_id', community.id);

      const uniqueMembers = new Set(members?.map(p => p.author_id) || []);

      setPostCount(posts || 0);
      setMemberCount(uniqueMembers.size);
    } catch (err) {
      console.error('Error loading community stats:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <div className="bg-[var(--card)] rounded-xl p-6 mb-6 shadow-card border border-white/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-16 w-16 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                <span className="text-2xl">🍒</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--fg)]">
                  c/{community.slug}
                </h1>
                <p className="text-[var(--muted)]">
                  Created {formatDate(community.created_at)}
                </p>
              </div>
            </div>
            
            {community.description && (
              <p className="text-[var(--fg)] text-lg leading-relaxed max-w-2xl">
                {community.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors font-medium"
            >
              🍒 Create Community
            </button>
          </div>
        </div>

        {/* Community Stats */}
        <div className="flex items-center gap-6 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--fg)]">{postCount}</div>
            <div className="text-sm text-[var(--muted)]">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--fg)]">{memberCount}</div>
            <div className="text-sm text-[var(--muted)]">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--accent)]">🍒</div>
            <div className="text-sm text-[var(--muted)]">Cherry</div>
          </div>
        </div>
      </div>

      <CreateCommunityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Refresh the page to show new community
          window.location.reload();
        }}
      />
    </>
  );
}
