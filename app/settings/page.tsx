'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { VH_BACKGROUNDS, VH_DESKS } from '@/lib/virtual/homeAssets';

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [homeBackgroundUrl, setHomeBackgroundUrl] = useState<string | null>(null);
  const [homeDeskUrl, setHomeDeskUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');

      // Load or init virtual_home (client-side best-effort)
      const { data: homeRow } = await supabase
        .from('virtual_home')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (homeRow) {
        setHomeBackgroundUrl(homeRow.background_url);
        setHomeDeskUrl(homeRow.desk_url);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null
      } : null);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--card)] rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[var(--card)] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--fg)] mb-4">
            Profile Not Found
          </h1>
          <p className="text-[var(--muted)]">
            Please log in to access your profile settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">
          Profile Settings
        </h1>
        <p className="text-[var(--muted)]">
          Customize your profile information and appearance.
        </p>
      </div>

      <div className="bg-[var(--card)] rounded-xl p-6 shadow-card border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder="Enter your display name"
              maxLength={50}
            />
            <p className="text-sm text-[var(--muted)] mt-1">
              This is how other users will see your name.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
            />
            <p className="text-sm text-[var(--muted)] mt-1">
              {bio.length}/200 characters
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-sm text-[var(--muted)] mt-1">
              Enter a URL to your profile picture. Leave empty to use initials.
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Virtual Home Settings */}
      <div className="bg-[var(--card)] rounded-xl p-6 shadow-card border border-white/5 mt-8">
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-4">Virtual Home</h2>
        <p className="text-[var(--muted)] mb-4">Pick a background and desk for your virtual home.</p>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-[var(--fg)] mb-2">Background</div>
            <div className="grid grid-cols-3 gap-3">
              {VH_BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase
                      .from('virtual_home')
                      .upsert({ user_id: user.id, background_url: b.fallback, desk_url: homeDeskUrl || VH_DESKS[0].fallback, items: [] }, { onConflict: 'user_id' })
                    setHomeBackgroundUrl(b.fallback);
                    setSuccess('Virtual home background updated.');
                  }}
                  className={`focus:outline-none rounded overflow-hidden ring-1 ring-white/10 hover:ring-white/20 ${homeBackgroundUrl === b.url ? 'ring-2 ring-[var(--accent)]' : ''}`}
                >
                  <img src={b.fallback} alt={b.alt} className="h-24 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-[var(--fg)] mb-2">Desk</div>
            <div className="grid grid-cols-2 gap-3">
              {VH_DESKS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await supabase
                      .from('virtual_home')
                      .upsert({ user_id: user.id, background_url: homeBackgroundUrl || VH_BACKGROUNDS[0].fallback, desk_url: d.fallback, items: [] }, { onConflict: 'user_id' })
                    setHomeDeskUrl(d.fallback);
                    setSuccess('Virtual home desk updated.');
                  }}
                  className={`focus:outline-none rounded overflow-hidden ring-1 ring-white/10 hover:ring-white/20 bg-white/5 p-2 ${homeDeskUrl === d.url ? 'ring-2 ring-[var(--accent)]' : ''}`}
                >
                  <img src={d.fallback} alt={d.alt} className="h-20 w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
