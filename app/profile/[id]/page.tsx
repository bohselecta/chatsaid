'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PostCard from '@/components/PostCard';

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Post {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  community_slug?: string;
  community_name?: string;
  like_count: number;
  comment_count: number;
}

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadPosts();
      getCurrentUser();
    }
  }, [profileId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_view')
        .select('*')
        .eq('author_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-[var(--card)] rounded-xl mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[var(--card)] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--fg)] mb-4">
            Profile Not Found
          </h1>
          <p className="text-[var(--muted)]">
            {error || 'This user profile could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-[var(--card)] rounded-xl p-6 mb-6 shadow-card border border-white/5">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-3xl">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={`${profile.display_name || 'User'} avatar`}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              (profile.display_name?.[0] || 'U').toUpperCase()
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-[var(--fg)]">
                {profile.display_name || 'Anonymous User'}
              </h1>
              {isOwnProfile && (
                <a 
                  href="/settings"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 transition-colors"
                >
                  Edit Profile
                </a>
              )}
            </div>
            
            {profile.bio && (
              <p className="text-[var(--fg)] text-lg leading-relaxed mb-4">
                {profile.bio}
              </p>
            )}

            <div className="text-[var(--muted)] text-sm">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--fg)] mb-6">
          Posts by {profile.display_name || 'Anonymous'}
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted)] text-lg">
              No posts yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
