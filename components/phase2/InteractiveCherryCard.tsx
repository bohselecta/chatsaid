'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '@/lib/analytics/events';
import { Heart, Star, Zap, MessageCircle, Eye, UserPlus, Clock, ChevronDown, ChevronUp, Maximize2, Minimize2, X } from 'lucide-react';
import { useBotIntegration } from '@/lib/hooks/useBotIntegration';
import VibeCanvas from '@/components/vibes/VibeCanvas';
import type { VibeApp } from '@/lib/types/vibes';
import VibeBadge from '@/components/vibes/VibeBadge';

type ReactionKey = 'funny' | 'weird' | 'technical' | 'research' | 'ideas';
type PartialReactionCounts = Partial<Record<ReactionKey, number>>;

interface Cherry {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_display_name?: string;
  author_avatar?: string;
  created_at: string;
  tags?: string[];
  simulated_activity?: boolean;
  bot_attribution?: string;
  engagement_score?: number;
  comment_count?: number;
  reaction_count?: number;
  reactionCounts?: PartialReactionCounts;
  // Optional vibe attachment (if present, renders an embedded app in expanded view)
  vibe?: {
    app: VibeApp;
    props?: any;
    poster_url?: string;
    aspect?: number;
    caption?: string;
  };
}

interface InteractiveCherryCardProps {
  cherry: Cherry;
  onReaction: (cherryId: string, reactionType: string) => void;
  onReactionBatch?: (cherryId: string, deltas: Partial<Record<ReactionKey, number>>) => void;
  onFollowBot?: (botName: string) => void;
  onSaveToCategory?: (cherryId: string, category: string) => void;
  onCategoryClick?: (categoryId: string) => void;
  userReactions?: string[]; // Track which reactions the current user has made
  userSavedCategories?: string[]; // Track which categories the user has saved this cherry to
}

// Category color palette (matching EnhancedCanopyV3)
const categoryColors = {
  funny: { color: '#FFEB3B', textColor: '#1a1a1a', name: 'Bright Yellow' },
  weird: { color: '#9C27B0', textColor: '#ffffff', name: 'Deep Purple' },
  technical: { color: '#1976D2', textColor: '#ffffff', name: 'Steel Blue' },
  research: { color: '#2E7D32', textColor: '#ffffff', name: 'Forest Green' },
  ideas: { color: '#D84315', textColor: '#ffffff', name: 'Vibrant Orange' }
};

// Category mapping for badges
const getCategoryIcon = (tags: string[] = []) => {
  if (tags.includes('coding') || tags.includes('tech')) return '/technical.svg';
  if (tags.includes('ai-insight') || tags.includes('ai')) return '🤖';
  if (tags.includes('philosophy') || tags.includes('mystical') || tags.includes('weird')) return '/weird.svg';
  if (tags.includes('creativity') || tags.includes('ideas')) return '/ideas.svg';
  if (tags.includes('research') || tags.includes('academic')) return '/research.svg';
  if (tags.includes('humor') || tags.includes('funny')) return '/funny.svg';
  return '🍒'; // Default cherry icon
};

// Get category ID from tags for filtering
const getCategoryId = (tags: string[] = []) => {
  if (tags.includes('humor') || tags.includes('funny')) return 'funny';
  if (tags.includes('philosophy') || tags.includes('metaphysical') || tags.includes('mystical') || tags.includes('weird')) return 'weird';
  if (tags.includes('coding') || tags.includes('tech')) return 'technical';
  if (tags.includes('research') || tags.includes('academic')) return 'research';
  if (tags.includes('creativity') || tags.includes('ideas')) return 'ideas';
  return null;
};

// Bot personality colors
const getBotColor = (botName: string) => {
  const colors = {
    'Crystal_Maize': '#8B5CF6', // Purple
    'Cherry_Ent': '#10B981', // Green
    'default': '#EF4444' // Red
  };
  return colors[botName as keyof typeof colors] || colors.default;
};

// Category badge colors (using curated color palette)
const getCategoryBadgeColor = (categoryId: string | null) => {
  const colors = {
    'funny': '#FFEB3B', // Bright Yellow - Optimism, energy, attention-grabbing
    'weird': '#9C27B0', // Deep Purple - Creativity, imagination, mystery
    'technical': '#1976D2', // Darker Blue - Trust, professionalism, calmness (improved contrast)
    'research': '#2E7D32', // Darker Green - Growth, stability, balance (improved contrast)
    'ideas': '#D84315', // Darker Orange - Enthusiasm, creativity, stimulation (improved contrast)
    'default': '#6B7280' // Gray
  };
  return colors[categoryId as keyof typeof colors] || colors.default;
};

// Time ago helper
const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

// Personal collection categories (using custom PNG icons)
const personalCategories = [
  {
    id: 'funny',
    name: 'Funny',
    description: 'Humor and entertaining content'
  },
  {
    id: 'weird',
    name: 'Weird',
    description: 'Strange, surprising, or mind-bending insights'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Technical and programming content'
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Research and academic content'
  },
  {
    id: 'ideas',
    name: 'Ideas',
    description: 'Creative ideas and inspiration'
  }
];

export default function InteractiveCherryCard({
  cherry,
  onReaction,
  onReactionBatch,
  onFollowBot,
  onSaveToCategory,
  onCategoryClick,
  userReactions = [],
  userSavedCategories = []
}: InteractiveCherryCardProps) {
  const { triggerSaveProposal } = useBotIntegration();
  const [isHovered, setIsHovered] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionMessage, setReactionMessage] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [publicLikes, setPublicLikes] = useState(Math.floor(Math.random() * 50) + 10);
  const [isLiked, setIsLiked] = useState(false); // Track if user has liked this cherry
  const [isDarkMode, setIsDarkMode] = useState(true);

  const isBotContent = cherry.bot_attribution || cherry.simulated_activity;
  const botName = cherry.bot_attribution || cherry.author_display_name || 'Unknown';
  const categoryIcon = getCategoryIcon(cherry.tags);
  const categoryId = getCategoryId(cherry.tags);

  const handlePublicLike = async () => {
    if (isReacting) return;
    
    setIsReacting(true);
    setReactionMessage(null);
    
    try {
      await onReaction(cherry.id, 'like');
      
      // Toggle like state
      if (isLiked) {
        setPublicLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
        setReactionMessage('Cherry unliked');
      } else {
        setPublicLikes(prev => prev + 1);
        setIsLiked(true);
        setReactionMessage('Cherry liked! 🍒');
      }
      
      // Clear message after 2 seconds
      setTimeout(() => setReactionMessage(null), 2000);
      
    } catch (error) {
      console.error('Like error:', error);
      setReactionMessage('Failed to like cherry. Please try again.');
      setTimeout(() => setReactionMessage(null), 2000);
    } finally {
      setIsReacting(false);
    }
  };

  const handleSaveToCategory = async (categoryId: string) => {
    if (isReacting) return;
    
    setIsReacting(true);
    setReactionMessage(null);
    
    try {
      try { track('card_action_click', { action: 'save', category: categoryId, cherryId: cherry.id }); } catch {}
      if (onSaveToCategory) {
        await onSaveToCategory(cherry.id, categoryId);
      }
      
      // Trigger bot proposal for the save action
      await triggerSaveProposal({
        id: cherry.id,
        title: cherry.title,
        content: cherry.content,
        author: cherry.author_display_name,
        author_id: cherry.author_id,
        tags: cherry.tags
      }, categoryId);
      
      const category = personalCategories.find(cat => cat.id === categoryId);
      setReactionMessage(`Saved to ${category?.name}! 📚 Check your assistant for suggestions.`);
      
      // Clear message after 3 seconds
      setTimeout(() => setReactionMessage(null), 3000);
      
    } catch (error) {
      console.error('Save error:', error);
      setReactionMessage('Failed to save cherry. Please try again.');
      setTimeout(() => setReactionMessage(null), 3000);
    } finally {
      setIsReacting(false);
    }
  };

  const handleCategoryClick = () => {
    if (categoryId && onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleContentExpanded = () => {
    setIsContentExpanded(!isContentExpanded);
  };

  const titleId = `card-title-${cherry.id}`;
  const enableReactions = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('enableReactions') === '1') || process.env.NEXT_PUBLIC_ENABLE_REACTIONS === '1';

  // Reaction counts (optimistic) + debounced dispatch
  type ReactionCounts = Record<ReactionKey, number>;

  const initialCounts = useMemo<ReactionCounts>(() => ({
    funny: cherry.reactionCounts?.funny ?? 0,
    weird: cherry.reactionCounts?.weird ?? 0,
    technical: cherry.reactionCounts?.technical ?? 0,
    research: cherry.reactionCounts?.research ?? 0,
    ideas: cherry.reactionCounts?.ideas ?? 0,
  }), [cherry.reactionCounts]);

  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const pendingDelta = useRef<Record<ReactionKey, number>>({ funny: 0, weird: 0, technical: 0, research: 0, ideas: 0 });
  const timers = useRef<Partial<Record<ReactionKey, number>>>({});
  const debounceMs = (typeof process !== 'undefined' && Number(process.env.NEXT_PUBLIC_REACT_DEBOUNCE_MS)) || 200;

  // One-time impression when hydrated counts exist (non-zero)
  const impressionSent = useRef(false);
  const hasHydratedCounts = (cherry.reactionCounts?.funny ?? 0)
    + (cherry.reactionCounts?.weird ?? 0)
    + (cherry.reactionCounts?.technical ?? 0)
    + (cherry.reactionCounts?.research ?? 0)
    + (cherry.reactionCounts?.ideas ?? 0) > 0;
  useEffect(() => {
    if (!impressionSent.current && hasHydratedCounts) {
      try { track('card_action_impression', { cherryId: cherry.id, counts }); } catch {}
      impressionSent.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cherry.id, hasHydratedCounts]);

  const flush = (key: ReactionKey) => {
    const delta = pendingDelta.current[key];
    pendingDelta.current[key] = 0;
    if (timers.current[key]) window.clearTimeout(timers.current[key]!);
    timers.current[key] = undefined;
    if (!onReaction || !delta) return;
    for (let i = 0; i < delta; i++) onReaction(cherry.id, key);
  };

  const queueReact = (key: ReactionKey) => {
    pendingDelta.current[key] += 1;
    if (timers.current[key]) window.clearTimeout(timers.current[key]!);
    timers.current[key] = window.setTimeout(() => flush(key), debounceMs);
  };

  const handleReactDebounced = (key: ReactionKey) => {
    setCounts((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }));
    try { track('card_action_click', { action: 'react', category: key, cherryId: cherry.id }); } catch {}
    if (onReactionBatch && ((typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_REACT_BATCH === '1') || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('enableBatch') === '1'))) {
      queueReactBatch(key);
    } else {
      queueReact(key);
    }
  };

  // Batch adapter (optional) — single timer for all keys
  const masterTimer = useRef<number | undefined>(undefined);
  const flushAll = () => {
    const deltas = { ...pendingDelta.current } as Partial<Record<ReactionKey, number>>;
    (Object.keys(deltas) as ReactionKey[]).forEach((k) => { pendingDelta.current[k] = 0; });
    if (masterTimer.current) window.clearTimeout(masterTimer.current);
    masterTimer.current = undefined;
    // Prefer batch if provided in props at runtime
    if (onReactionBatch && ((typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_REACT_BATCH === '1') || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('enableBatch') === '1'))) {
      const clean = Object.fromEntries(
        (Object.entries(deltas) as [ReactionKey, number][]).filter(([, n]) => (n || 0) > 0)
      ) as Partial<Record<ReactionKey, number>>;
      if (Object.keys(clean).length) onReactionBatch(cherry.id, clean);
      return;
    }
    // Fallback: per-click dispatch
    if (onReaction) {
      (Object.entries(deltas) as [ReactionKey, number][])
        .forEach(([k, n]) => { for (let i = 0; i < (n || 0); i++) onReaction(cherry.id, k); });
    }
  };

  const queueReactBatch = (key: ReactionKey) => {
    pendingDelta.current[key] = (pendingDelta.current[key] ?? 0) + 1;
    if (masterTimer.current) window.clearTimeout(masterTimer.current);
    masterTimer.current = window.setTimeout(flushAll, debounceMs);
  };

  return (
    <article 
      data-testid="cherry-card"
      aria-labelledby={titleId}
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600
        transition-all duration-200 ease-out
        hover:shadow-lg dark:hover:shadow-xl hover:scale-[1.02] hover:border-gray-300 dark:hover:border-gray-500
        ${isHovered ? 'ring-2 ring-cherry-100 dark:ring-cherry-900' : ''}
        cursor-pointer relative overflow-visible
      `}
      style={{
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? isDarkMode 
            ? '0 8px 25px rgba(0,0,0,0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)' 
            : '0 8px 25px rgba(0,0,0,0.12), 0 0 0 1px rgba(239, 68, 68, 0.1)'
          : isDarkMode 
            ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)' 
            : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        backgroundColor: isDarkMode ? '#1b1f26' : '#ffffff'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={-1}
    >
      {/* Reaction Message Toast */}
      {reactionMessage && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          {reactionMessage}
        </div>
      )}

      {/* Header / Author Info */}
      <div className="flex items-center justify-between px-4 py-3.5 gap-2">
        <div className="flex items-center space-x-3">
                     {/* Bot Avatar */}
           <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-cherry-50 to-cherry-100 dark:from-cherry-900 dark:to-cherry-800 border border-cherry-200 dark:border-cherry-700 shadow-sm">
             <img 
               src="/cherrycardstamp.png" 
               alt={`${botName} avatar`}
               className="w-10 h-10 object-contain"
             />
           </div>
          
          {/* Bot Name & Timestamp */}
          <div className="flex flex-col">
            <span 
              className="font-semibold text-sm text-gray-800 dark:text-gray-100"
              style={{ 
                lineHeight: '1.35',
                letterSpacing: '-0.01em'
              }}
            >
              {botName}
            </span>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
              <Clock className="w-3 h-3" />
              <span style={{ letterSpacing: '0.01em' }}>
                {getTimeAgo(cherry.created_at)}
              </span>
            </div>
          </div>
        </div>

                 {/* Category Badge - Clickable for filtering */}
         <button
           onClick={(e) => {
             e.stopPropagation();
             handleCategoryClick();
           }}
           className={`
             text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-all duration-200
             ${categoryId ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'cursor-default'}
           `}
           style={{ 
             backgroundColor: getCategoryBadgeColor(categoryId),
             color: categoryId && categoryColors[categoryId as keyof typeof categoryColors] 
               ? categoryColors[categoryId as keyof typeof categoryColors].textColor 
               : '#ffffff',
             letterSpacing: '0.01em'
           }}
           title={categoryId ? `Filter by ${categoryId} category (${categoryColors[categoryId as keyof typeof categoryColors]?.name || categoryId})` : 'Category'}
         >
          {categoryIcon.endsWith('.png') ? (
            <img 
              src={`/${categoryIcon}`}
              alt="Category icon"
              className="w-4 h-4 object-contain"
            />
          ) : (
            <span>{categoryIcon}</span>
          )}
        </button>
      </div>

      {/* Content Preview */}
      <div className="px-4 pb-4 pt-0">
        <h3 
          id={titleId}
          className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100"
          style={{ 
            lineHeight: '1.3',
            letterSpacing: '-0.015em'
          }}
        >
          {cherry.title}
        </h3>
        <div 
          className="text-sm text-gray-700 dark:text-gray-300"
          style={{ 
            lineHeight: '1.7',
            letterSpacing: '0.005em'
          }}
        >
          {cherry.content.length > 200 ? (
            <div>
              <p>
                {isContentExpanded 
                  ? cherry.content
                  : `${cherry.content.substring(0, 200)}...`
                }
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleContentExpanded();
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-1 transition-colors"
              >
                {isContentExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>
          ) : (
            <p>{cherry.content}</p>
          )}
        </div>
      </div>

      {/* Public Like System & Comments */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
        {/* Public Cherry Like */}
         <button
           onClick={(e) => {
             e.stopPropagation();
             try { track('card_action_click', { action: 'like', state: !isLiked ? 'off→on' : 'on→off', cherryId: cherry.id }); } catch {}
             handlePublicLike();
           }}
           disabled={isReacting}
           className={`
             flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-cherry-500 transition-all duration-200
             ${isReacting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
             group
           `}
           title={isLiked ? "Unlike this cherry" : "Like this cherry"}
           data-testid="card-action-like"
           aria-pressed={isLiked}
           aria-label={isLiked ? 'Unlike' : 'Like'}
         >
           <div className="relative">
             <img 
               src={isLiked ? "/cherry-liked.png" : "/cherry-empty.png"}
               alt={isLiked ? "Liked cherry" : "Empty cherry"}
               className={`w-4 h-4 object-contain transition-all duration-200 ${
                 isLiked ? 'animate-pulse' : 'group-hover:scale-110 group-hover:animate-bounce'
               }`}
             />
             {isLiked && (
               <div className="absolute -top-1 -right-1 w-2 h-2 bg-cherry-400 rounded-full animate-ping"></div>
             )}
           </div>
           <span 
             className="font-medium text-gray-500 dark:text-gray-400 group-hover:text-cherry-500"
             style={{ fontSize: '0.8125rem' }}
           >
             {publicLikes}
           </span>
         </button>

        {/* Optional Reactions Toolbar (flagged) */}
        {enableReactions && (
          <div role="group" aria-label="Reactions" className="ml-2 hidden sm:flex items-center gap-1">
            <button data-testid="react-funny" aria-label={`React: Funny (${counts.funny})`} className="rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
              onClick={(e) => { e.stopPropagation(); handleReactDebounced('funny'); }}>
              <span aria-hidden>😄</span>
              <span data-testid="react-count-funny" aria-live="polite" className="text-xs tabular-nums">{counts.funny}</span>
            </button>
            <button data-testid="react-weird" aria-label={`React: Weird (${counts.weird})`} className="rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
              onClick={(e) => { e.stopPropagation(); handleReactDebounced('weird'); }}>
              <span aria-hidden>🛸</span>
              <span data-testid="react-count-weird" aria-live="polite" className="text-xs tabular-nums">{counts.weird}</span>
            </button>
            <button data-testid="react-technical" aria-label={`React: Technical (${counts.technical})`} className="rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
              onClick={(e) => { e.stopPropagation(); handleReactDebounced('technical'); }}>
              <span aria-hidden>🛠️</span>
              <span data-testid="react-count-technical" aria-live="polite" className="text-xs tabular-nums">{counts.technical}</span>
            </button>
            <button data-testid="react-research" aria-label={`React: Research (${counts.research})`} className="rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
              onClick={(e) => { e.stopPropagation(); handleReactDebounced('research'); }}>
              <span aria-hidden>📚</span>
              <span data-testid="react-count-research" aria-live="polite" className="text-xs tabular-nums">{counts.research}</span>
            </button>
            <button data-testid="react-ideas" aria-label={`React: Ideas (${counts.ideas})`} className="rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/50"
              onClick={(e) => { e.stopPropagation(); handleReactDebounced('ideas'); }}>
              <span aria-hidden>💡</span>
              <span data-testid="react-count-ideas" aria-live="polite" className="text-xs tabular-nums">{counts.ideas}</span>
            </button>
          </div>
        )}

        {/* Comments Count */}
        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-4 h-4" />
          <span 
            className="font-medium"
            style={{ fontSize: '0.8125rem' }}
          >
            {cherry.comment_count || 0}
          </span>
        </div>
      </div>

              {/* Expandable Personal Collection Section */}
      <div className="border-t border-gray-100 dark:border-gray-700 flex-shrink-0 relative">
        {/* Expand/Collapse Tab */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          className="w-full flex items-center justify-center py-2 px-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
          data-testid="card-action-save"
          aria-label="Save to My Room"
        >
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 group-hover:text-gray-800 dark:group-hover:text-gray-100">
            <img 
              src="/pick-large.png"
              alt="Pick cherry icon"
              className="w-6 h-6 object-contain"
            />
            <span 
              className="font-medium"
              style={{ fontSize: '0.875rem' }}
            >
              Pick Cherry
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform" />
            )}
          </div>
        </button>

                 {/* Expandable Content - Absolute Positioned Overlay */}
         <div className={`
           absolute top-full left-0 right-0 z-20
           overflow-hidden transition-all duration-300 ease-in-out
           ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
         `}>
           <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 border-t border-blue-200 dark:border-blue-600 shadow-xl rounded-b-xl">
            {/* Collection Description */}
            <div className="mb-3 text-blue-700 dark:text-blue-300">
              <div className="flex items-center space-x-2">
                <img 
                  src="/pick-large.png"
                  alt="Pick cherry icon"
                  className="w-6 h-6 object-contain"
                />
                <div 
                  style={{ 
                    fontSize: '0.8125rem',
                    lineHeight: '1.45'
                  }}
                >
                  <strong>Pick cherries for your personal collection!</strong> Your AI companion will analyze and learn from content you save.
                </div>
              </div>
            </div>

            {/* Personal Collection Dock (Compact Style) */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {personalCategories.map((category) => {
                const isSaved = userSavedCategories.includes(category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToCategory(category.id);
                    }}
                    disabled={isReacting}
                    className={`
                      flex items-center space-x-2 p-2 rounded-lg border transition-all
                      ${isSaved 
                        ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900'
                      }
                      ${isReacting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={isSaved ? `Remove from ${category.name}` : `Save to ${category.name}`}
                    aria-label={isSaved ? `Remove from ${category.name}` : `Save to ${category.name}`}
                    data-testid={`save-${category.id}`}
                  >
                    <img 
                      src={`/${category.id}.png`}
                      alt={`${category.name} icon`}
                      className={`w-4 h-4 object-contain ${isSaved ? 'opacity-100' : 'opacity-75'}`}
                    />
                    <div className="flex flex-col items-start flex-1">
                      <span 
                        className={`font-medium ${isSaved ? 'text-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}
                        style={{ 
                          fontSize: '0.8125rem',
                          lineHeight: '1.35'
                        }}
                      >
                        {category.name}
                      </span>
                      <span 
                        className="text-gray-500 dark:text-gray-400"
                        style={{ 
                          fontSize: '0.75rem',
                          lineHeight: '1.35'
                        }}
                      >
                        {category.description}
                      </span>
                    </div>
                    {isSaved && (
                      <div className="ml-auto">
                        <span 
                          className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Saved
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Vibe App Canvas (if attached) */}
            {cherry.vibe?.app && (
              <VibeEmbedded cherry={cherry} />
            )}

            {/* Follow Bot Button */}
            {isBotContent && onFollowBot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowBot(botName);
                }}
                className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center space-x-1"
                style={{ fontSize: '0.8125rem' }}
              >
                <UserPlus className="w-3 h-3" />
                <span>Follow {botName}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function VibeEmbedded({ cherry }: { cherry: any }) {
  const [fullscreen, setFullscreen] = React.useState(false);
  const firstRef = React.useRef<HTMLButtonElement>(null);
  const lastRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  React.useEffect(() => {
    if (fullscreen) firstRef.current?.focus();
  }, [fullscreen]);

  const source = cherry.vibe.app.provider === 'remote-url'
    ? (cherry.vibe.app.embed_url ? new URL(cherry.vibe.app.embed_url).host : 'remote')
    : (cherry.vibe.app.npm_pkg || 'npm');

  return (
    <section className="mt-4 space-y-2" aria-label={`Vibe App: ${cherry.vibe.app.name}`}>
      <div className="flex items-center justify-between">
        <VibeBadge source={source} />
        <button
          onClick={(e) => { e.stopPropagation(); setFullscreen((v) => !v); }}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
      </div>

      {!fullscreen && (
        <VibeCanvas
          app={cherry.vibe.app}
          initialProps={cherry.vibe.props}
          posterUrl={cherry.vibe.poster_url}
          aspect={cherry.vibe.aspect}
          className="mt-1"
        />
      )}
      {cherry.vibe.caption && !fullscreen && (
        <p className="text-sm text-gray-700 dark:text-white/70">{cherry.vibe.caption}</p>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setFullscreen(false)} aria-hidden></div>
          <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col p-3">
            <div className="mb-2 flex items-center justify-between text-white">
              <div className="text-sm opacity-80">Vibe App: {cherry.vibe.app.name}</div>
              <button ref={firstRef} onClick={() => setFullscreen(false)} className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/20" aria-label="Close vibe fullscreen">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-black">
              <VibeCanvas
                app={cherry.vibe.app}
                initialProps={cherry.vibe.props}
                posterUrl={cherry.vibe.poster_url}
                aspect={cherry.vibe.aspect}
                className="h-full w-full"
                fullHeight
              />
            </div>
            {cherry.vibe.caption && (
              <p className="mt-2 text-sm text-white/80">{cherry.vibe.caption}</p>
            )}
            {/* Focus trap sentinel */}
            <button ref={lastRef} onClick={() => firstRef.current?.focus()} className="sr-only">end</button>
          </div>
        </div>
      )}
    </section>
  );
}
