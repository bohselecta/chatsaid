'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CreateCommunityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('communities').insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        created_by: user.id
      });

      if (error) {
        if (error.code === '23505') {
          setError('A community with this name or slug already exists');
        } else {
          setError(error.message);
        }
      } else {
        onSuccess();
        onClose();
        setName('');
        setSlug('');
        setDescription('');
      }
    } catch (err) {
      setError('Failed to create community');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--fg)]">Create Community</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="community-name" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Community Name
            </label>
            <input
              id="community-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 text-[var(--fg)] border border-white/10 focus:border-[var(--accent)] transition-colors"
              placeholder="e.g., Cherry Chat"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label htmlFor="community-slug" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Community Slug
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[var(--muted)]">c/</span>
              <input
                id="community-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-3 pl-8 rounded-lg bg-white/5 text-[var(--fg)] border border-white/10 focus:border-[var(--accent)] transition-colors"
                placeholder="my-community"
                maxLength={30}
                required
              />
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              This will be the URL: chatsaid.com/c/{slug}
            </p>
          </div>

          <div>
            <label htmlFor="community-description" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Description (Optional)
            </label>
            <textarea
              id="community-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 text-[var(--fg)] border border-white/10 focus:border-[var(--accent)] transition-colors resize-none"
              placeholder="What is this community about?"
              rows={3}
              maxLength={200}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-white/10 text-[var(--fg)] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !slug.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                submitting || !name.trim() || !slug.trim()
                  ? 'bg-[var(--muted)] text-white/50 cursor-not-allowed'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
              }`}
            >
              {submitting ? 'Creating...' : '🍒 Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
