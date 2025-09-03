'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SafetyDot from './SafetyDot';

interface Branch {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

interface Twig {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_id: string;
}

interface CherryComposerProps {
  communityId?: string;
  onCherryCreated?: () => void;
}

export default function CherryComposer({ communityId, onCherryCreated }: CherryComposerProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedTwig, setSelectedTwig] = useState<string>('');
  const [privacyLevel, setPrivacyLevel] = useState<'private' | 'friends' | 'public'>('private');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [twigs, setTwigs] = useState<Twig[]>([]);
  const [error, setError] = useState<string>('');


  const router = useRouter();

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadTwigs(selectedBranch);
    } else {
      setTwigs([]);
      setSelectedTwig('');
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_primary', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadTwigs = async (branchId: string) => {
    try {
      const { data, error } = await supabase
        .from('twigs')
        .select('*')
        .eq('branch_id', branchId)
        .order('name');

      if (error) throw error;
      setTwigs(data || []);
    } catch (error) {
      console.error('Error loading twigs:', error);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter some content for your cherry');
      return;
    }

    if (!selectedBranch) {
      setError('Please select a branch for your cherry');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is currently punted
      const { data: puntData } = await supabase.rpc('is_user_punted', {
        p_user_id: user.id
      });

      if (puntData && puntData.length > 0) {
        setError('🚫 You are currently punted and cannot create cherries. Please wait for your timeout to expire.');
        return;
      }

      // Insert the cherry
      const { data: cherry, error: cherryError } = await supabase
        .from('cherries')
        .insert({
          author_id: user.id,
          title: title.trim() || null,
          content: content.trim(),
          privacy_level: privacyLevel,
          tags: tags.length > 0 ? tags : null,
          source_file: sourceFile.trim() || null,
          line_number: lineNumber ? parseInt(lineNumber) : null,
          image_url: imageUrl.trim() || null,
        })
        .select()
        .single();

      if (cherryError) throw cherryError;

      // Link cherry to branch and twig
      if (cherry && selectedBranch) {
        const { error: linkError } = await supabase
          .from('cherry_branches')
          .insert({
            cherry_id: cherry.id,
            branch_id: selectedBranch,
            twig_id: selectedTwig || null,
          });

        if (linkError) throw linkError;
      }

      // Reset form
      setContent('');
      setTitle('');
      setSelectedBranch('');
      setSelectedTwig('');
      setPrivacyLevel('private');
      setTags([]);
      setSourceFile('');
      setLineNumber('');
      setImageUrl('');

      // Notify parent component
      if (onCherryCreated) {
        onCherryCreated();
      }

      // Show success message
      setError(''); // Clear any previous errors
      // You could add a success state here if needed

    } catch (error) {
      console.error('Error creating cherry:', error);
      setError('Failed to create cherry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'private': return '🔒';
      case 'friends': return '👥';
      case 'public': return '🌍';
      default: return '🔒';
    }
  };

  const getPrivacyDescription = (level: string) => {
    switch (level) {
      case 'private': return 'Only you can see this cherry';
      case 'friends': return 'Your friends can see this cherry';
      case 'public': return 'Everyone can see this cherry (appears in canopy)';
      default: return 'Only you can see this cherry';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">🍒 Create New Cherry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Privacy Level Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Privacy Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['private', 'friends', 'public'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPrivacyLevel(level)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  privacyLevel === level
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{getPrivacyIcon(level)}</div>
                <div className="text-sm font-medium text-white capitalize">{level}</div>
                <div className="text-xs text-gray-400 text-center">
                  {getPrivacyDescription(level)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Give your cherry a title..."
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            AI Snippet Content *
          </label>
          <div className="relative">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="What's sh*t did your AI say? Share it with the community..."
              maxLength={2000}
              required
            />
            
            {/* Safety Dot - positioned at bottom-right */}
            <div className="absolute bottom-2 right-2">
              <SafetyDot 
                content={content} 
                contentType="cherry"
                size="md"
              />
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1 text-right">
            {content.length}/2000
          </div>
        </div>

        {/* Branch and Twig Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-300 mb-2">
              Branch *
            </label>
            <select
              id="branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select a branch...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="twig" className="block text-sm font-medium text-gray-300 mb-2">
              Twig (Optional)
            </label>
            <select
              id="twig"
              value={selectedTwig}
              onChange={(e) => setSelectedTwig(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={!selectedBranch}
            >
              <option value="">Select a twig...</option>
              {twigs.map((twig) => (
                <option key={twig.id} value={twig.id}>
                  {twig.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Add tags to help organize your cherries..."
              maxLength={20}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim() || tags.length >= 10}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-white text-sm rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {tags.length}/10 tags max
          </div>
        </div>

        {/* Source File and Line Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sourceFile" className="block text-sm font-medium text-gray-300 mb-2">
              Source File (Optional)
            </label>
            <input
              type="text"
              id="sourceFile"
              value={sourceFile}
              onChange={(e) => setSourceFile(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., main.py, index.js"
            />
          </div>

          <div>
            <label htmlFor="lineNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Line Number (Optional)
            </label>
            <input
              type="number"
              id="lineNumber"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., 42"
              min="1"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="https://example.com/image.png"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !content.trim() || !selectedBranch}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Cherry...' : '🍒 Create Cherry'}
        </button>
      </form>
    </div>
  );
}
