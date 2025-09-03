'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Community = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  created_by?: string;
};

type CommunityCardProps = {
  community: Community;
  showStats?: boolean;
};

export default function CommunityCard({ community, showStats = true }: CommunityCardProps) {
  const [postCount, setPostCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (showStats) {
      loadCommunityStats();
    }
  }, [community.id, showStats]);

  const loadCommunityStats = async () => {
    try {
      // Get post count
      const { count: posts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      // Get unique member count
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
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Link href={`/c/${community.slug}`}>
      <div className="bg-[var(--card)] rounded-xl p-6 shadow-card border border-white/5 hover:border-[var(--accent)]/30 transition-all duration-200 hover:scale-[1.02] group">
        {/* Community Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center group-hover:bg-[var(--accent)]/30 transition-colors">
            <span className="text-xl">🍒</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
              c/{community.slug}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Created {formatDate(community.created_at)}
            </p>
          </div>
        </div>

        {/* Community Description */}
        {community.description && (
          <p className="text-[var(--fg)] text-sm leading-relaxed mb-4 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Community Stats */}
        {showStats && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[var(--fg)]">
                <span className="font-semibold">{postCount}</span> posts
              </span>
              <span className="text-[var(--muted)]">•</span>
              <span className="text-[var(--fg)]">
                <span className="font-semibold">{memberCount}</span> members
              </span>
            </div>
            <span className="text-[var(--accent)] text-sm font-medium group-hover:translate-x-1 transition-transform">
              View →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
