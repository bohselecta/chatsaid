'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, XCircle, Edit3, Save, RotateCcw, Heart, Lightbulb } from 'lucide-react';

interface CherrySuggestion {
  id: string;
  prompt: string;
  mood?: string;
  style_seed?: string;
  cherry_text: string;
  provenance: {
    source: string;
    confidence: number;
    reasoning: string;
    bot_version: string;
  };
  score: number;
  created_at: string;
  status?: string;
}

interface CherryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const MOODS = [
  'inspirational', 'whimsical', 'thoughtful', 'playful', 
  'serious', 'creative', 'analytical', 'emotional', 'curious'
];

export default function CherryOverlay({ isOpen, onClose, userId }: CherryOverlayProps) {
  const [prompt, setPrompt] = useState('');
  const [mood, setMood] = useState<string>('');
  const [styleSeed, setStyleSeed] = useState<string>('');
  const [cherries, setCherries] = useState<CherrySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCherry, setEditingCherry] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPublicBuckets, setShowPublicBuckets] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Load pending cherries on open
  useEffect(() => {
    if (isOpen) {
      loadPendingCherries();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadPendingCherries = async () => {
    try {
      const response = await fetch('/api/agent/cherries?status=pending');
      if (response.ok) {
        const { cherries: pendingCherries } = await response.json();
        setCherries(pendingCherries || []);
      }
    } catch (error) {
      console.error('Failed to load pending cherries:', error);
    }
  };

  const generateCherries = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/agent/cherries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mood: mood || undefined,
          style_seed: styleSeed || undefined
        }),
      });

      if (response.ok) {
        const { cherries: newCherries } = await response.json();
        setCherries(newCherries || []);
        // Clear form
        setPrompt('');
        setMood('');
        setStyleSeed('');
      } else {
        console.error('Failed to generate cherries');
      }
    } catch (error) {
      console.error('Error generating cherries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCherryStatus = async (cherryId: string, status: string, text?: string) => {
    try {
      const response = await fetch('/api/agent/cherries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: cherryId,
          status,
          ...(text && { cherry_text: text })
        }),
      });

      if (response.ok) {
        // Remove from local state
        setCherries(prev => prev.filter(c => c.id !== cherryId));
        setEditingCherry(null);
        setEditText('');
      } else {
        console.error('Failed to update cherry status');
      }
    } catch (error) {
      console.error('Error updating cherry status:', error);
    }
  };

  const startEditing = (cherry: CherrySuggestion) => {
    setEditingCherry(cherry.id);
    setEditText(cherry.cherry_text);
  };

  const saveEdit = () => {
    if (editingCherry && editText.trim()) {
      updateCherryStatus(editingCherry, 'edited', editText.trim());
    }
  };

  const cancelEdit = () => {
    setEditingCherry(null);
    setEditText('');
  };

  const getMoodIcon = (mood: string) => {
    const icons = {
      inspirational: <Sparkles className="w-4 h-4" />,
      whimsical: <Heart className="w-4 h-4" />,
      thoughtful: <Lightbulb className="w-4 h-4" />,
      playful: <RotateCcw className="w-4 h-4" />,
      serious: <Edit3 className="w-4 h-4" />,
      creative: <Sparkles className="w-4 h-4" />,
      analytical: <Lightbulb className="w-4 h-4" />,
      emotional: <Heart className="w-4 h-4" />,
      curious: <Lightbulb className="w-4 h-4" />
    };
    return icons[mood as keyof typeof icons] || <Lightbulb className="w-4 h-4" />;
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      inspirational: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      whimsical: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      thoughtful: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      playful: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      serious: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      creative: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      analytical: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      emotional: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      curious: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[mood as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cherry-500 to-cherry-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Cherry Generation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate personalized cherry suggestions based on your intent
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Close cherry overlay"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Input Section */}
        <div className="p-6 bg-gradient-to-r from-cherry-50 to-cherry-100 dark:from-cherry-900 dark:to-cherry-800 border-b border-cherry-200 dark:border-cherry-700">
          <div className="space-y-4">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What's on your mind?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your idea, question, or inspiration..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500 resize-none"
                rows={3}
              />
            </div>

            {/* Mood and Style Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood (optional)
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  title="Select a mood for cherry generation"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500"
                >
                  <option value="">Select a mood...</option>
                  {MOODS.map(moodOption => (
                    <option key={moodOption} value={moodOption}>
                      {moodOption.charAt(0).toUpperCase() + moodOption.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Style Seed (optional)
                </label>
                <input
                  type="text"
                  value={styleSeed}
                  onChange={(e) => setStyleSeed(e.target.value)}
                  placeholder="Previous cherry or example text..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCherries}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                loading || !prompt.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-cherry-500 text-white hover:bg-cherry-600'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating cherries...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Cherries</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Generated Cherries */}
        <div className="flex-1 overflow-y-auto p-6">
          {cherries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No cherries yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Enter a prompt above to generate your first cherry suggestions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cherries.map((cherry, index) => (
                <div key={cherry.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        {cherry.mood && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getMoodColor(cherry.mood)}`}>
                            {getMoodIcon(cherry.mood)}
                            <span>{cherry.mood}</span>
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Score: {(cherry.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Cherry Text */}
                    {editingCherry === cherry.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Edit the cherry text..."
                          title="Edit cherry text"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500 resize-none"
                          rows={3}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={saveEdit}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">
                        {cherry.cherry_text}
                      </p>
                    )}

                    {/* Provenance */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <p>Confidence: {(cherry.provenance.confidence * 100).toFixed(0)}% • {cherry.provenance.reasoning}</p>
                    </div>

                    {/* Actions */}
                    {editingCherry !== cherry.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCherryStatus(cherry.id, 'selected')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-cherry-500 text-white rounded-lg hover:bg-cherry-600 transition-colors text-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Select</span>
                        </button>
                        
                        <button
                          onClick={() => startEditing(cherry)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => updateCherryStatus(cherry.id, 'discarded')}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Discard</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powered by AI • Personalized for your interests
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPublicBuckets(!showPublicBuckets)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {showPublicBuckets ? 'Hide' : 'View'} Public Buckets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
