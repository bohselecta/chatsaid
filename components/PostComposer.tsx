'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_type: string;
  is_primary_branch: boolean;
}

interface Twig {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_id: string;
}

interface PostComposerProps {
  communityId?: string;
  onPostCreated?: () => void;
}

export default function PostComposer({ communityId, onPostCreated }: PostComposerProps) {
  const [body, setBody] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<string>(communityId || '');
  const [selectedTwig, setSelectedTwig] = useState<string>('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [twigs, setTwigs] = useState<Twig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Enhanced cherry metadata
  const [sourceFile, setSourceFile] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const maxLength = 300;
  const remainingChars = maxLength - body.length;

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      loadTwigs(selectedCommunity);
    } else {
      setTwigs([]);
    }
  }, [selectedCommunity]);

  const loadCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name');

      if (error) throw error;
      setCommunities(data || []);
    } catch (err) {
      console.error('Error loading communities:', err);
    }
  };

  const loadTwigs = async (communityId: string) => {
    try {
      const { data, error } = await supabase
        .from('twigs')
        .select('*')
        .eq('branch_id', communityId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTwigs(data || []);
    } catch (err) {
      console.error('Error loading twigs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!body.trim()) {
      setError('Please enter some content for your cherry.');
      return;
    }

    if (!selectedCommunity) {
      setError('Please select a branch for your cherry.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to post.');
        return;
      }

      const postData: any = {
        body: body.trim(),
        author_id: user.id,
        community_id: selectedCommunity,
      };

      // Add twig if selected
      if (selectedTwig) {
        postData.twig_id = selectedTwig;
      }

      // Add enhanced metadata if provided
      if (sourceFile.trim()) {
        postData.source_file = sourceFile.trim();
      }
      if (lineNumber.trim()) {
        postData.line_number = parseInt(lineNumber);
      }
      if (imageUrl.trim()) {
        postData.image_url = imageUrl.trim();
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      setSuccess('Cherry posted successfully! 🍒');
      setBody('');
      setSelectedTwig('');
      setSourceFile('');
      setLineNumber('');
      setImageUrl('');
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }

      // Auto-hide success message
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to post cherry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBranchIcon = (type: string) => {
    switch (type) {
      case 'funny': return '😄';
      case 'mystical': return '✨';
      case 'technical': return '⚡';
      case 'research': return '🔬';
      case 'ideas': return '💡';
      default: return '🌿';
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 mb-6 shadow-card border border-white/5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch Selection */}
        <div>
          <label htmlFor="community" className="block text-sm font-medium text-[var(--fg)] mb-2">
            Branch 🌳
          </label>
          <select
            id="community"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
            aria-label="Select branch for your cherry"
          >
            <option value="">Choose a branch...</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
                {community.is_primary_branch ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Twig Selection */}
        {selectedCommunity && twigs.length > 0 && (
          <div>
            <label htmlFor="twig" className="block text-sm font-medium text-[var(--fg)] mb-2">
              Twig 🌿 (Optional)
            </label>
            <select
              id="twig"
              value={selectedTwig}
              onChange={(e) => setSelectedTwig(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Select twig for your cherry (optional)"
            >
              <option value="">No specific twig</option>
              {twigs.map((twig) => (
                <option key={twig.id} value={twig.id}>
                  🌿 {twig.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cherry Content */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-[var(--fg)] mb-2">
            Your Cherry 🍒
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's sh*t did your AI say? Share it with the community..."
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            rows={4}
            maxLength={maxLength}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-[var(--muted)]">
              {remainingChars} characters remaining
            </span>
            {remainingChars < 50 && (
              <span className={`text-sm ${remainingChars < 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                {remainingChars < 10 ? '⚠️' : '⚠️'} {remainingChars}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source File */}
          <div>
            <label htmlFor="sourceFile" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Source File (Optional)
            </label>
            <input
              type="text"
              id="sourceFile"
              value={sourceFile}
              onChange={(e) => setSourceFile(e.target.value)}
              placeholder="e.g., main.py, index.js"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Line Number */}
          <div>
            <label htmlFor="lineNumber" className="block text-sm font-medium text-[var(--muted)] mb-2">
              Line Number (Optional)
            </label>
            <input
              type="number"
              id="lineNumber"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              placeholder="e.g., 42"
              min="1"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-[var(--muted)] mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            Add an image to accompany your cherry (256x256 recommended)
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
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !body.trim() || !selectedCommunity}
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Posting...
              </>
            ) : (
              <>
                🍒 Post Cherry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
