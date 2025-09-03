'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';

interface Cherry {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name?: string;
  created_at: string;
  tags?: string[];
  category?: string;
  visibility?: 'public' | 'private' | 'friends';
}

interface EnhancedCherryCardProps {
  cherry: Cherry;
  onSaveToCategory: (cherryId: string, category: string) => void;
  onAddToWatchlist?: (cherryId: string, category: string) => void;
  userSavedCategories?: string[];
  className?: string;
}

const categories = [
  { id: 'funny', name: 'Funny', icon: 'funny.svg', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'weird', name: 'Weird', icon: 'weird.svg', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { id: 'technical', name: 'Technical', icon: 'technical.svg', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'research', name: 'Research', icon: 'research.svg', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { id: 'ideas', name: 'Ideas', icon: 'ideas.svg', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' }
];

export default function EnhancedCherryCard({
  cherry,
  onSaveToCategory,
  onAddToWatchlist,
  userSavedCategories = [],
  className = ''
}: EnhancedCherryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [showWatchlistPrompt, setShowWatchlistPrompt] = useState<string | null>(null);

  const handleSaveToCategory = async (categoryId: string) => {
    setSaving(categoryId);
    try {
      await onSaveToCategory(cherry.id, categoryId);
      setShowWatchlistPrompt(categoryId);
      // Hide prompt after 3 seconds
      setTimeout(() => setShowWatchlistPrompt(null), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleAddToWatchlist = async (categoryId: string) => {
    if (onAddToWatchlist) {
      try {
        await onAddToWatchlist(cherry.id, categoryId);
        setShowWatchlistPrompt(null);
      } catch (error) {
        console.error('Watchlist error:', error);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {cherry.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              by {cherry.author_display_name || 'Unknown'} • {new Date(cherry.created_at).toLocaleDateString()}
            </p>
          </div>
          {cherry.category && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              categories.find(c => c.id === cherry.category)?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {categories.find(c => c.id === cherry.category)?.name || cherry.category}
            </span>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {cherry.content.length > 200 
            ? `${cherry.content.substring(0, 200)}...` 
            : cherry.content
          }
        </p>
        
        {cherry.tags && cherry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {cherry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
            {cherry.tags.length > 3 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{cherry.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expandable Section */}
      <div className="border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-3 px-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        >
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 group-hover:text-gray-800 dark:group-hover:text-gray-100">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium text-sm">Add Cherry</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 bg-gradient-to-r from-cherry-50 to-cherry-100 dark:from-cherry-900 dark:to-cherry-800 border-t border-cherry-200 dark:border-cherry-700">
            <div className="mb-3">
              <p className="text-cherry-800 dark:text-cherry-200 text-sm font-medium">
                Save this cherry to your personal collection:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {categories.map((category) => {
                const isSaved = userSavedCategories.includes(category.id);
                const isSaving = saving === category.id;
                const showPrompt = showWatchlistPrompt === category.id;

                return (
                  <div key={category.id} className="relative">
                    <button
                      onClick={() => handleSaveToCategory(category.id)}
                      disabled={isSaving || isSaved}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        isSaved
                          ? 'bg-white dark:bg-gray-800 border-cherry-300 dark:border-cherry-600 shadow-sm'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <img
                        src={`/${category.icon}`}
                        alt={`${category.name} icon`}
                        className={`w-5 h-5 object-contain ${isSaved ? 'opacity-100' : 'opacity-75'}`}
                      />
                      <div className="flex-1 text-left">
                        <span className={`font-medium text-sm ${
                          isSaved ? 'text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {category.name}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isSaved ? 'Saved to collection' : 'Click to save'}
                        </p>
                      </div>
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-cherry-500 border-t-transparent rounded-full animate-spin" />
                      ) : isSaved ? (
                        <Check className="w-4 h-4 text-cherry-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {/* Watchlist Prompt */}
                    {showPrompt && onAddToWatchlist && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Saved to {category.name}! Add to watchlist for AI monitoring?
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddToWatchlist(category.id)}
                            className="px-3 py-1 bg-cherry-500 text-white rounded text-xs hover:bg-cherry-600 transition-colors"
                          >
                            Yes, Add to Watchlist
                          </button>
                          <button
                            onClick={() => setShowWatchlistPrompt(null)}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Not Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
