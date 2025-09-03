'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bot, Users, Sparkles, Filter, Clock, TrendingUp, MessageCircle, Heart, Star, Zap } from 'lucide-react';
import CanopyNavigation from './CanopyNavigation';

interface Cherry {
  id: string;
  title?: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  created_at: string;
  tags?: string[];
  simulated_activity?: boolean;
  bot_attribution?: string;
  engagement_score?: number;
  comment_count?: number;
  reaction_count?: number;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_display_name: string;
  is_bot_comment?: boolean;
  bot_personality?: string;
  created_at: string;
  simulated_activity?: boolean;
}

interface Reaction {
  id: string;
  reaction_type: 'heart' | 'star' | 'zap';
  user_id: string;
  user_display_name?: string;
  is_bot_reaction?: boolean;
  bot_personality?: string;
  created_at: string;
  simulated_activity?: boolean;
}

type SortOption = 'newest' | 'popular' | 'bot-focus' | 'mixed';

export default function EnhancedCanopyV2() {
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('mixed');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  useEffect(() => {
    loadCanopyData();
  }, []);

  const loadCanopyData = async () => {
    try {
      setLoading(true);
      
      // Load cherries with engagement data
      const { data: cherriesData, error: cherriesError } = await supabase
        .from('cherries')
        .select(`
          id,
          title,
          content,
          author_id,
          author_display_name,
          author_avatar,
          created_at,
          tags,
          simulated_activity,
          bot_attribution,
          engagement_score
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (cherriesError) throw cherriesError;
      setCherries(cherriesData || []);

      // Load comments for all cherries
      const { data: commentsData, error: commentsError } = await supabase
        .from('enhanced_comments')
        .select(`
          id,
          cherry_id,
          content,
          author_id,
          author_display_name,
          is_bot_comment,
          bot_personality,
          created_at,
          simulated_activity
        `)
        .in('cherry_id', cherriesData?.map(c => c.id) || []);

      if (commentsError) throw commentsError;
      
      // Group comments by cherry_id
      const commentsByCherry: Record<string, Comment[]> = {};
      commentsData?.forEach(comment => {
        if (!commentsByCherry[comment.cherry_id]) {
          commentsByCherry[comment.cherry_id] = [];
        }
        commentsByCherry[comment.cherry_id].push(comment);
      });
      setComments(commentsByCherry);

      // Load reactions for all cherries
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('user_reactions')
        .select(`
          id,
          cherry_id,
          reaction_type,
          user_id,
          user_display_name,
          is_bot_reaction,
          bot_personality,
          created_at,
          simulated_activity
        `)
        .in('cherry_id', cherriesData?.map(c => c.id) || []);

      if (reactionsError) throw reactionsError;
      
      // Group reactions by cherry_id
      const reactionsByCherry: Record<string, Reaction[]> = {};
      reactionsData?.forEach(reaction => {
        if (!reactionsByCherry[reaction.cherry_id]) {
          reactionsByCherry[reaction.cherry_id] = [];
        }
        reactionsByCherry[reaction.cherry_id].push(reaction);
      });
      setReactions(reactionsByCherry);

    } catch (error) {
      console.error('Error loading canopy data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter cherries based on selected option
  const sortedCherries = useMemo(() => {
    let sorted = [...cherries];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      case 'popular':
        return sorted.sort((a, b) => {
          const aScore = (comments[a.id]?.length || 0) + (reactions[a.id]?.length || 0);
          const bScore = (comments[b.id]?.length || 0) + (reactions[b.id]?.length || 0);
          return bScore - aScore;
        });
      
      case 'bot-focus':
        return sorted.filter(cherry => cherry.simulated_activity || cherry.bot_attribution);
      
      case 'mixed':
      default:
        // Mix of newest, popular, and bot content
        const botCherries = sorted.filter(c => c.simulated_activity || c.bot_attribution);
        const userCherries = sorted.filter(c => !c.simulated_activity && !c.bot_attribution);
        
        // Sort each group
        botCherries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        userCherries.sort((a, b) => {
          const aScore = (comments[a.id]?.length || 0) + (reactions[a.id]?.length || 0);
          const bScore = (comments[b.id]?.length || 0) + (reactions[b.id]?.length || 0);
          return bScore - aScore;
        });
        
        // Interleave bot and user content
        const mixed: Cherry[] = [];
        const maxLength = Math.max(botCherries.length, userCherries.length);
        
        for (let i = 0; i < maxLength; i++) {
          if (i < botCherries.length) mixed.push(botCherries[i]);
          if (i < userCherries.length) mixed.push(userCherries[i]);
        }
        
        return mixed;
    }
  }, [cherries, sortBy, comments, reactions]);

  // Calculate visual hierarchy (fade older content)
  const getCherryOpacity = (cherry: Cherry) => {
    const daysOld = (Date.now() - new Date(cherry.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 1) return 1;
    if (daysOld < 3) return 0.9;
    if (daysOld < 7) return 0.8;
    return 0.7;
  };

  // Get engagement stats for a cherry
  const getEngagementStats = (cherryId: string) => {
    const cherryComments = comments[cherryId] || [];
    const cherryReactions = reactions[cherryId] || [];
    
    return {
      commentCount: cherryComments.length,
      reactionCount: cherryReactions.length,
      botCommentCount: cherryComments.filter(c => c.is_bot_comment).length,
      botReactionCount: cherryReactions.filter(r => r.is_bot_reaction).length,
      hasBotInteraction: cherryComments.some(c => c.is_bot_comment) || cherryReactions.some(r => r.is_bot_reaction)
    };
  };

  // Toggle thread expansion
  const toggleThread = (cherryId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(cherryId)) {
      newExpanded.delete(cherryId);
    } else {
      newExpanded.add(cherryId);
    }
    setExpandedThreads(newExpanded);
  };

  // Get reaction tooltip content
  const getReactionTooltip = (cherryId: string, reactionType: string) => {
    const cherryReactions = reactions[cherryId] || [];
    const typeReactions = cherryReactions.filter(r => r.reaction_type === reactionType);
    
    const botReactions = typeReactions.filter(r => r.is_bot_reaction);
    const userReactions = typeReactions.filter(r => !r.is_bot_reaction);
    
    let tooltip = `${reactionType} reactions:\n`;
    
    if (botReactions.length > 0) {
      tooltip += `🤖 ${botReactions.map(r => r.bot_personality || 'Bot').join(', ')}\n`;
    }
    
    if (userReactions.length > 0) {
      tooltip += `👤 ${userReactions.map(r => r.user_display_name || 'User').join(', ')}`;
    }
    
    return tooltip;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading enhanced canopy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Canopy Navigation */}
      <CanopyNavigation />
      
      {/* Header with sorting controls */}
      <div className="sticky top-0 z-30 bg-gray-800/95 backdrop-blur-sm border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🌳 Enhanced Canopy</h1>
              <p className="text-gray-400 text-sm">A bustling creative workspace with AI companions</p>
            </div>
            
            {/* Sorting Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSortBy('mixed')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'mixed' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Mixed
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'newest' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Newest
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'popular' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Popular
                </button>
                <button
                  onClick={() => setSortBy('bot-focus')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'bot-focus' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Bot className="w-4 h-4 inline mr-1" />
                  Bot Focus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCherries.map((cherry, index) => {
            const engagement = getEngagementStats(cherry.id);
            const opacity = getCherryOpacity(cherry);
            const isBotContent = cherry.simulated_activity || cherry.bot_attribution;
            const isExpanded = expandedThreads.has(cherry.id);
            
            return (
              <div
                key={cherry.id}
                className={`bg-gray-800 rounded-lg border transition-all duration-300 hover:shadow-lg hover:shadow-black/20 ${
                  isBotContent 
                    ? 'border-blue-500/30 bg-blue-500/5' 
                    : 'border-gray-600'
                }`}
                style={{ opacity }}
              >
                {/* Cherry Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                      {cherry.title || 'Untitled Cherry'}
                    </h3>
                    {isBotContent && (
                      <div className="flex items-center gap-1 text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded">
                        <Bot className="w-3 h-3" />
                        {cherry.bot_attribution || 'AI'}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                    {cherry.content}
                  </p>
                  
                  {/* Tags */}
                  {cherry.tags && cherry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cherry.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>by {cherry.author_display_name}</span>
                    <span>{new Date(cherry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Engagement Section */}
                <div className="p-4">
                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {engagement.commentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {engagement.reactionCount}
                      </span>
                    </div>
                    
                    {/* Bot Interaction Indicator */}
                    {engagement.hasBotInteraction && (
                      <div className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                        🤖 Bot activity
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {engagement.reactionCount > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      {['heart', 'star', 'zap'].map((reactionType) => {
                        const typeReactions = (reactions[cherry.id] || []).filter(r => r.reaction_type === reactionType);
                        if (typeReactions.length === 0) return null;
                        
                        const icon = reactionType === 'heart' ? '❤️' : reactionType === 'star' ? '⭐' : '⚡';
                        
                        return (
                          <div
                            key={reactionType}
                            className="relative group"
                            onMouseEnter={() => setHoveredReaction(`${cherry.id}-${reactionType}`)}
                            onMouseLeave={() => setHoveredReaction(null)}
                          >
                            <span className="text-sm cursor-help">
                              {icon} {typeReactions.length}
                            </span>
                            
                            {/* Reaction Tooltip */}
                            {hoveredReaction === `${cherry.id}-${reactionType}` && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-pre-line z-10 border border-gray-600">
                                {getReactionTooltip(cherry.id, reactionType)}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comments Preview */}
                  {engagement.commentCount > 0 && (
                    <div className="space-y-2">
                      {/* Show first comment or preview */}
                      {!isExpanded && engagement.commentCount > 1 ? (
                        <div className="text-sm text-gray-400">
                          <span className="text-blue-400">
                            {comments[cherry.id]?.[0]?.content.substring(0, 60)}...
                          </span>
                          <button
                            onClick={() => toggleThread(cherry.id)}
                            className="ml-2 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            +{engagement.commentCount - 1} more replies
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(comments[cherry.id] || []).slice(0, isExpanded ? undefined : 1).map((comment) => (
                            <div
                              key={comment.id}
                              className={`text-sm p-2 rounded ${
                                comment.is_bot_comment 
                                  ? 'bg-blue-500/10 border border-blue-500/20' 
                                  : 'bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-200">
                                  {comment.author_display_name}
                                </span>
                                {comment.is_bot_comment && (
                                  <span className="text-blue-400 text-xs">🤖 {comment.bot_personality}</span>
                                )}
                              </div>
                              <p className="text-gray-300">{comment.content}</p>
                            </div>
                          ))}
                          
                          {isExpanded && engagement.commentCount > 1 && (
                            <button
                              onClick={() => toggleThread(cherry.id)}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement Nudge */}
                  {isBotContent && engagement.commentCount === 0 && (
                    <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                      💡 {cherry.bot_attribution || 'AI'} shared this insight—what do you think?
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedCherries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
              <span className="text-gray-500 text-4xl">🍒</span>
            </div>
            <p className="text-gray-400 text-lg">No cherries found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
