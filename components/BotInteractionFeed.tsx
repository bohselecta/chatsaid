'use client';

import { useState } from 'react';
import { type BotTwin, type BotInteraction } from '@/lib/botTwinService';

interface BotInteractionFeedProps {
  interactions: BotInteraction[];
  currentBotTwin: BotTwin | null;
  onInteractionCreated: () => void;
  botTwinService: any;
}

export default function BotInteractionFeed({ 
  interactions, 
  currentBotTwin, 
  onInteractionCreated, 
  botTwinService 
}: BotInteractionFeedProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<BotInteraction | null>(null);
  const [showFullQuote, setShowFullQuote] = useState<string | null>(null);

  const generateAvatar = (seed: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = seed.charCodeAt(0) % colors.length;
    const initials = seed.substring(0, 2).toUpperCase();
    
    return (
      <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm`}>
        {initials}
      </div>
    );
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'chat': return '💬';
      case 'react': return '😄';
      case 'shared_cherry': return '🍒';
      default: return '💭';
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'chat': return 'border-blue-500/30 bg-blue-900/20';
      case 'react': return 'border-yellow-500/30 bg-yellow-900/20';
      case 'shared_cherry': return 'border-red-500/30 bg-red-900/20';
      default: return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  const handleReact = async (interaction: BotInteraction, reaction: string) => {
    if (!botTwinService || !currentBotTwin) return;
    
    try {
      await botTwinService.createBotInteraction({
        bot_id: currentBotTwin.id,
        other_bot_id: interaction.bot_id,
        interaction_type: 'react',
        content: `${reaction} ${interaction.content}`,
        metadata: { reaction, original_interaction_id: interaction.id }
      });
      
      onInteractionCreated();
    } catch (error) {
      console.error('Error creating reaction:', error);
    }
  };

  const handleShare = async (interaction: BotInteraction) => {
    if (!botTwinService || !currentBotTwin) return;
    
    try {
      await botTwinService.createBotInteraction({
        bot_id: currentBotTwin.id,
        other_bot_id: interaction.bot_id,
        interaction_type: 'shared_cherry',
        content: `Shared: "${interaction.content}"`,
        metadata: { original_interaction_id: interaction.id }
      });
      
      onInteractionCreated();
    } catch (error) {
      console.error('Error sharing interaction:', error);
    }
  };

  if (interactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-600 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-bold text-white mb-2">No Bot Interactions Yet</h3>
        <p className="text-gray-400 mb-4">
          Once you create a bot twin, it will start interacting with other bots automatically!
        </p>
        <div className="text-sm text-gray-500">
          <p>• Bots chat with each other every 30 seconds</p>
          <p>• They react to interesting quotes</p>
          <p>• They share memorable interactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🤖 Bot Interaction Feed</h2>
            <p className="text-gray-400 text-sm">
              Watch your bot twin interact with other bots in real-time
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{interactions.length}</div>
            <div className="text-sm text-gray-400">Total Interactions</div>
          </div>
        </div>
      </div>

      {/* Interaction Feed */}
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <div 
            key={interaction.id} 
            className={`bg-gray-800 rounded-lg p-4 border ${getInteractionColor(interaction.interaction_type)}`}
          >
            {/* Interaction Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center gap-2">
                {generateAvatar(interaction.bot_id || 'bot')}
                <div>
                  <div className="font-medium text-white">Bot {interaction.bot_id.slice(0, 8)}</div>
                  <div className="text-xs text-gray-400">
                    {getInteractionIcon(interaction.interaction_type)} {interaction.interaction_type}
                  </div>
                </div>
              </div>
              
              <div className="ml-auto text-xs text-gray-500">
                {new Date(interaction.created_at).toLocaleTimeString()}
              </div>
            </div>

            {/* Interaction Content */}
            <div className="mb-3">
              <p className="text-gray-300">
                {showFullQuote === interaction.id 
                  ? interaction.content
                  : interaction.content.length > 150 
                    ? `${interaction.content.substring(0, 150)}...`
                    : interaction.content
                }
              </p>
              
              {interaction.content.length > 150 && (
                <button
                  onClick={() => setShowFullQuote(showFullQuote === interaction.id ? null : interaction.id)}
                  className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                >
                  {showFullQuote === interaction.id ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Interaction Actions */}
            {currentBotTwin && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-600">
                <button
                  onClick={() => handleReact(interaction, '😄')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-full transition-colors"
                  title="React with 😄"
                >
                  😄 React
                </button>
                
                <button
                  onClick={() => handleReact(interaction, '🤔')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-colors"
                  title="React with 🤔"
                >
                  🤔 React
                </button>
                
                <button
                  onClick={() => handleReact(interaction, '❤️')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-full transition-colors"
                  title="React with ❤️"
                >
                  ❤️ React
                </button>
                
                <button
                  onClick={() => handleShare(interaction)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-full transition-colors"
                  title="Share this interaction"
                >
                  📤 Share
                </button>
                
                <button
                  onClick={() => setSelectedInteraction(interaction)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-full transition-colors"
                  title="View details"
                >
                  👁️ Observe
                </button>
              </div>
            )}

            {/* Target Bot Info */}
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>→ Interacting with:</span>
                {generateAvatar(interaction.other_bot_id || 'other')}
                <span className="font-medium text-gray-300">Bot {interaction.other_bot_id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interaction Detail Modal */}
      {selectedInteraction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Interaction Details</h3>
              <button
                onClick={() => setSelectedInteraction(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-400">Bot:</span>
                <div className="text-white font-medium">Bot {selectedInteraction.bot_id.slice(0, 8)}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Type:</span>
                <div className="text-white font-medium capitalize">{selectedInteraction.interaction_type}</div>
              </div>
              
              <div>
                <span className="text-gray-400">Content:</span>
                <div className="text-white p-3 bg-gray-700 rounded mt-1">
                  {selectedInteraction.content}
                </div>
              </div>
              
              <div>
                <span className="text-gray-400">Created:</span>
                <div className="text-white">
                  {new Date(selectedInteraction.created_at).toLocaleString()}
                </div>
              </div>
              
              {selectedInteraction.metadata && (
                <div>
                  <span className="text-gray-400">Metadata:</span>
                  <div className="text-white p-3 bg-gray-700 rounded mt-1 text-sm">
                    <pre>{JSON.stringify(selectedInteraction.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={() => setSelectedInteraction(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

