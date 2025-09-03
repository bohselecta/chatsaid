'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, MessageCircle, Zap, Star } from 'lucide-react';
import { AIBotService, BotPersonality } from '@/lib/aiBotService';
import { SocialService } from '@/lib/socialService';

interface BotInteractionPanelProps {
  cherryId: string;
  onBotComment?: () => void; // Callback when bot adds a comment
}

export default function BotInteractionPanel({ cherryId, onBotComment }: BotInteractionPanelProps) {
  const [botPersonalities, setBotPersonalities] = useState<BotPersonality[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBotComment, setLastBotComment] = useState<string>('');

  useEffect(() => {
    loadBotPersonalities();
  }, []);

  const loadBotPersonalities = async () => {
    try {
      const bots = await AIBotService.getBotPersonalities();
      setBotPersonalities(bots);
      if (bots.length > 0) {
        setSelectedBot(bots[0].id);
      }
    } catch (error) {
      console.error('Error loading bot personalities:', error);
    }
  };

  const handleGenerateBotResponse = async () => {
    if (!selectedBot) return;

    try {
      setIsGenerating(true);
      
      // Get conversation context
      const comments = await SocialService.getComments(cherryId);
      const context = {
        cherry_id: cherryId,
        branch_context: 'general', // Simplified for now
        existing_comments: comments,
        user_interests: ['technology', 'philosophy', 'art', 'science'], // Default interests
        conversation_history: []
      };

      // Generate bot response
      const botComment = await AIBotService.generateBotResponse(selectedBot, cherryId, context);
      
      if (botComment) {
        setLastBotComment(botComment.content);
        onBotComment?.(); // Notify parent component
      }
    } catch (error) {
      console.error('Error generating bot response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickBotReaction = async (reactionType: 'heart' | 'laugh' | 'zap' | 'star') => {
    if (!selectedBot) return;

    try {
      // For now, we'll just log the reaction
      // In a full implementation, this would trigger a bot reaction
      console.log(`Bot ${selectedBot} reacted with ${reactionType} to cherry ${cherryId}`);
    } catch (error) {
      console.error('Error handling bot reaction:', error);
    }
  };

  const getBotAvatar = (bot: BotPersonality) => {
    // Generate avatar based on bot personality
    const colors = {
      friendly: 'bg-green-500',
      professional: 'bg-blue-500',
      casual: 'bg-yellow-500',
      philosophical: 'bg-purple-500',
      humorous: 'bg-pink-500'
    };

    return (
      <div className={`w-8 h-8 rounded-full ${colors[bot.conversation_style]} flex items-center justify-center`}>
        <Bot className="w-5 h-5 text-white" />
      </div>
    );
  };

  const getBotStyleDescription = (style: string) => {
    const descriptions = {
      friendly: 'Warm and encouraging',
      professional: 'Thoughtful and analytical',
      casual: 'Relaxed and approachable',
      philosophical: 'Deep and contemplative',
      humorous: 'Fun and entertaining'
    };
    return descriptions[style as keyof typeof descriptions] || style;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-200">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold">AI Bot Interactions</h3>
      </div>

      {/* Bot Selection */}
      <div className="space-y-3">
        <label className="text-sm text-gray-300">Choose Bot Personality:</label>
        <div className="grid grid-cols-1 gap-2">
          {botPersonalities.map((bot) => (
            <div
              key={bot.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${selectedBot === bot.id 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                }
              `}
              onClick={() => setSelectedBot(bot.id)}
            >
              {getBotAvatar(bot)}
              <div className="flex-1">
                <div className="font-medium text-white">{bot.name}</div>
                <div className="text-sm text-gray-400">{getBotStyleDescription(bot.conversation_style)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Expertise: {bot.expertise_areas.join(', ')}
                </div>
              </div>
              {selectedBot === bot.id && (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleGenerateBotResponse}
          disabled={isGenerating || !selectedBot}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${isGenerating || !selectedBot
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
            }
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Response...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Generate Bot Comment
            </>
          )}
        </button>

        {/* Quick Bot Reactions */}
        <div className="flex gap-2">
          {(['heart', 'laugh', 'zap', 'star'] as const).map((reaction) => (
            <button
              key={reaction}
              onClick={() => handleQuickBotReaction(reaction)}
              disabled={!selectedBot}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${!selectedBot
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200 hover:scale-105'
                }
              `}
            >
              {reaction === 'heart' && <Zap className="w-4 h-4 text-red-400" />}
              {reaction === 'laugh' && <Zap className="w-4 h-4 text-yellow-400" />}
              {reaction === 'zap' && <Zap className="w-4 h-4 text-blue-400" />}
              {reaction === 'star' && <Star className="w-4 h-4 text-purple-400" />}
              Bot {reaction}
            </button>
          ))}
        </div>
      </div>

      {/* Last Bot Comment */}
      {lastBotComment && (
        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <div className="text-sm text-gray-400 mb-2">Last Bot Response:</div>
          <div className="text-gray-200 italic">&quot;{lastBotComment}&quot;</div>
        </div>
      )}

      {/* Bot Info */}
      <div className="text-xs text-gray-500 text-center">
        AI bots can comment, react, and engage with cherries based on their personality and expertise.
      </div>
    </div>
  );
}
