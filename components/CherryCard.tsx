'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share2, Bookmark, Calendar, FileText, MessageCircle, Heart, Laugh, Zap, Star } from 'lucide-react';
import CommentThread from './CommentThread';
import ReactionButton, { ReactionType } from './ReactionButton';
import BotInteractionPanel from './BotInteractionPanel';
import { SocialService } from '@/lib/socialService';
import { supabase } from '@/lib/supabaseClient';

interface CherryCardProps {
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
    reactions?: Record<ReactionType, number>;
    comment_count?: number;
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

export default function CherryCard({ cherry, branch, isOpen, onClose }: CherryCardProps) {
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [reactions, setReactions] = useState<Record<ReactionType, number>>(
    cherry.reactions || { heart: 0, laugh: 0, zap: 0, star: 0 }
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    }
  }, [isOpen, cherry.id]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        // Load user's reactions for this cherry
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

  if (!isOpen) return null;

  const getBranchColor = (color: string) => {
    return color.startsWith('#') ? color : `#${color}`;
  };

  const handleReaction = async (type: ReactionType) => {
    if (!currentUser) {
      // Redirect to login or show login prompt
      console.log('User must be logged in to react');
      return;
    }

    try {
      setLoading(true);
      const wasAdded = await SocialService.toggleReaction(cherry.id, currentUser.id, type);
      
      if (wasAdded) {
        // Reaction was added
        setReactions(prev => ({
          ...prev,
          [type]: prev[type] + 1
        }));
        setUserReactions(prev => [...prev, type]);
      } else {
        // Reaction was removed
        setReactions(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
        setUserReactions(prev => prev.filter(r => r !== type));
      }

      // Track activity
      await SocialService.trackActivity(currentUser.id, 'react', cherry.id);
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Card content */}
      <div className="relative w-80 max-h-[480px] bg-gray-800 rounded-lg border border-gray-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          {/* Branch tag */}
          <div 
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getBranchColor(branch.color) }}
          >
            {branch.name}
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Calendar className="w-3 h-3" />
            {formatDate(cherry.created_at)}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label="Close cherry card"
            title="Close cherry card"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Title if exists */}
          {cherry.title && (
            <h3 className="text-lg font-semibold text-white">{cherry.title}</h3>
          )}
          
          {/* Main content */}
          <div className="text-gray-200 leading-relaxed">
            {cherry.content}
          </div>
          
          {/* Image if exists */}
          {cherry.image_url && (
            <div className="flex justify-center">
              <Image
                src={cherry.image_url}
                alt="Cherry content"
                width={256}
                height={256}
                className="max-w-[256px] max-h-[256px] object-contain rounded"
              />
            </div>
          )}
          
          {/* Tags if exist */}
          {cherry.tags && cherry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cherry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Source info (collapsible) */}
          {(cherry.source_file || cherry.line_number) && (
            <div className="border-t border-gray-600 pt-4">
              <button
                onClick={() => setIsSourceExpanded(!isSourceExpanded)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">Source Info</span>
              </button>
              
              {isSourceExpanded && (
                <div className="mt-2 p-3 bg-gray-700 rounded text-sm text-gray-300">
                  {cherry.source_file && (
                    <div className="mb-1">
                      <span className="font-medium">File:</span> {cherry.source_file}
                    </div>
                  )}
                  {cherry.line_number && (
                    <div>
                      <span className="font-medium">Line:</span> {cherry.line_number}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-600 bg-gray-750">
          {/* Reaction Row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {(['heart', 'laugh', 'zap', 'star'] as ReactionType[]).map((type) => (
              <ReactionButton
                key={type}
                type={type}
                count={reactions[type] || 0}
                isActive={userReactions.includes(type)}
                onReact={handleReaction}
                size="sm"
              />
            ))}
          </div>
          
          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Comments button */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Comments {cherry.comment_count ? `(${cherry.comment_count})` : ''}
            </button>
            
            {/* Share button */}
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            {/* Clip button */}
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors">
              <Bookmark className="w-4 h-4" />
              Clip
            </button>
          </div>
        </div>
        
        {/* AI Bot Interactions */}
        {showComments && (
          <div className="border-t border-gray-600">
            <BotInteractionPanel 
              cherryId={cherry.id} 
              onBotComment={() => {
                // Refresh comments when bot adds a comment
                setShowComments(false);
                setTimeout(() => setShowComments(true), 100);
              }}
            />
          </div>
        )}

        {/* Comments Section */}
        <CommentThread
          cherryId={cherry.id}
          isVisible={showComments}
          onToggle={() => setShowComments(!showComments)}
        />
      </div>
    </div>
  );
}
