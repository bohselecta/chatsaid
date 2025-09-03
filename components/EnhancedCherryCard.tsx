'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share2, MessageCircle, Heart, Laugh, Zap, Star, Bot, Calendar, Tag } from 'lucide-react';
import CommentThread from './CommentThread';
import ReactionButton, { ReactionType } from './ReactionButton';
import BotInteractionPanel from './BotInteractionPanel';
import { SocialService } from '@/lib/socialService';
import { supabase } from '@/lib/supabaseClient';

interface EnhancedCherryCardProps {
  cherry: {
    id: string;
    title?: string;
    content: string;
    image_url?: string;
    source_file?: string;
    line_number?: number;
    created_at: string;
    tags?: string[];
    review_status: string;
    bot_attribution?: string;
    engagement_score?: number;
    share_count?: number;
    author_id: string;
    author_display_name: string;
    author_avatar?: string;
  };
  branch: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedCherryCard({ cherry, branch, isOpen, onClose }: EnhancedCherryCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    heart: 0,
    laugh: 0,
    zap: 0,
    star: 0
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Load user data and reactions when card opens
  useEffect(() => {
    if (isOpen) {
      loadUserData();
      loadReactions();
      loadEngagementData();
    }
  }, [isOpen, cherry.id]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        const userReactions = await SocialService.getUserReactions(cherry.id, user.id);
        setUserReactions(userReactions);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadReactions = async () => {
    try {
      const cherryReactions = await SocialService.getCherryReactions(cherry.id);
      setReactions(cherryReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const loadEngagementData = async () => {
    try {
      const { data, error } = await supabase
        .from('cherry_engagement')
        .select('*')
        .eq('cherry_id', cherry.id)
        .single();
      
      if (!error && data) {
        setEngagementData(data);
      }
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  };

  if (!isOpen) return null;

  const getBranchColor = (color: string) => {
    return color.startsWith('#') ? color : `#${color}`;
  };

  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) {
      console.log('User must be logged in to react');
      return;
    }

    try {
      setLoading(true);
      await SocialService.toggleReaction(cherry.id, currentUser.id, type);
      await SocialService.trackActivity(currentUser.id, 'react', cherry.id);
      
      // Refresh reactions
      await loadReactions();
      await loadEngagementData();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!currentUser) {
      console.log('User must be logged in to share');
      return;
    }

    try {
      const shareMessage = `Check out this cherry from ${cherry.author_display_name}! 🍒`;
      
      const { error } = await supabase
        .from('cherry_shares')
        .insert({
          cherry_id: cherry.id,
          shared_by: currentUser.id,
          bot_attribution: false,
          share_message: shareMessage
        });

      if (error) throw error;
      
      // Refresh engagement data
      await loadEngagementData();
      
      // Update local share count
      if (engagementData) {
        setEngagementData({
          ...engagementData,
          total_shares: (engagementData.total_shares || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error sharing cherry:', error);
    }
  };

  const totalEngagement = (engagementData?.total_reactions || 0) + 
                         (engagementData?.total_comments || 0) + 
                         (engagementData?.total_shares || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-800 rounded-lg border border-gray-600 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ width: '280px', minHeight: '120px', maxHeight: '350px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: getBranchColor(branch.color) }}
            >
              {branch.icon}
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{branch.name}</h3>
              <p className="text-gray-400 text-xs">{formatDate(cherry.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close cherry card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Bot Attribution */}
          {cherry.bot_attribution && (
            <div className="flex items-center gap-2 mb-3 text-sm text-blue-400">
              <Bot className="w-4 h-4" />
              <span>via {cherry.bot_attribution}</span>
            </div>
          )}

          {/* Title */}
          {cherry.title && (
            <h2 className="text-white font-medium text-base mb-2 leading-tight">
              {cherry.title}
            </h2>
          )}

          {/* Content */}
          <div className="text-gray-200 text-sm mb-4 leading-relaxed">
            {cherry.content}
          </div>

          {/* Image */}
          {cherry.image_url && (
            <div className="mb-4">
              <Image
                src={cherry.image_url}
                alt="Cherry content"
                width={256}
                height={256}
                className="rounded-lg max-w-full h-auto"
                style={{ maxWidth: '256px', maxHeight: '256px' }}
              />
            </div>
          )}

          {/* Tags */}
          {cherry.tags && cherry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cherry.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Source Info */}
          {cherry.source_file && (
            <div className="text-xs text-gray-400 mb-4">
              📁 {cherry.source_file}
              {cherry.line_number && ` • Line ${cherry.line_number}`}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-4">
              <span>❤️ {reactions.heart}</span>
              <span>😄 {reactions.laugh}</span>
              <span>⚡ {reactions.zap}</span>
              <span>⭐ {reactions.star}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💬 {engagementData?.total_comments || 0}</span>
              <span>📤 {engagementData?.total_shares || 0}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <ReactionButton
              type="heart"
              count={reactions.heart}
              isActive={userReactions.includes('heart')}
              onReact={handleReaction}
            />
            <ReactionButton
              type="laugh"
              count={reactions.laugh}
              isActive={userReactions.includes('laugh')}
              onReact={handleReaction}
            />
            <ReactionButton
              type="zap"
              count={reactions.zap}
              isActive={userReactions.includes('zap')}
              onReact={handleReaction}
            />
            <ReactionButton
              type="star"
              count={reactions.star}
              isActive={userReactions.includes('star')}
              onReact={handleReaction}
            />
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {showComments ? 'Hide' : 'Comments'}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          {/* AI Bot Interactions */}
          {showComments && (
            <div className="border-t border-gray-600 pt-4">
              <BotInteractionPanel 
                cherryId={cherry.id} 
                onBotComment={() => {
                  setShowComments(false);
                  setTimeout(() => setShowComments(true), 100);
                }}
              />
            </div>
          )}

          {/* Comments Section */}
          {showComments && (
            <CommentThread
              cherryId={cherry.id}
              isVisible={showComments}
              onToggle={() => setShowComments(!showComments)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
