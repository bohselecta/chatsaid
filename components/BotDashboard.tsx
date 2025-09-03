'use client';

import { useState, useEffect } from 'react';
import { Bot, TrendingUp, MessageCircle, Users, Activity, Settings, Sparkles } from 'lucide-react';
import { AIBotService, BotPersonality } from '@/lib/aiBotService';
import BotPersonalityCreator from './BotPersonalityCreator';

interface BotStats {
  totalInteractions: number;
  activeBots: number;
  totalComments: number;
  engagementRate: number;
}

export default function BotDashboard() {
  const [botPersonalities, setBotPersonalities] = useState<BotPersonality[]>([]);
  const [botStats, setBotStats] = useState<BotStats>({
    totalInteractions: 0,
    activeBots: 0,
    totalComments: 0,
    engagementRate: 0
  });
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBotCreator, setShowBotCreator] = useState(false);

  useEffect(() => {
    loadBotData();
  }, []);

  const loadBotData = async () => {
    try {
      setIsLoading(true);
      const bots = await AIBotService.getBotPersonalities();
      setBotPersonalities(bots);
      
      if (bots.length > 0) {
        setSelectedBot(bots[0].id);
        // Calculate basic stats
        const activeBots = bots.filter(b => b.is_active).length;
        setBotStats({
          totalInteractions: 0, // Would come from actual data
          activeBots,
          totalComments: 0, // Would come from actual data
          engagementRate: 0.85 // Placeholder
        });
      }
    } catch (error) {
      console.error('Error loading bot data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBotStyleColor = (style: string) => {
    const colors = {
      friendly: 'text-green-400',
      professional: 'text-blue-400',
      casual: 'text-yellow-400',
      philosophical: 'text-purple-400',
      humorous: 'text-pink-400'
    };
    return colors[style as keyof typeof colors] || 'text-gray-400';
  };

  const getBotStyleIcon = (style: string) => {
    const icons = {
      friendly: '😊',
      professional: '📊',
      casual: '😎',
      philosophical: '🤔',
      humorous: '😄'
    };
    return icons[style as keyof typeof icons] || '🤖';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Bot Dashboard</h1>
            <p className="text-gray-400">Monitor and manage your AI conversation partners</p>
          </div>
        </div>
        <button 
          onClick={() => setShowBotCreator(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2 inline" />
          Create Bot
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Interactions</p>
              <p className="text-2xl font-bold text-white">{botStats.totalInteractions}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Bots</p>
              <p className="text-2xl font-bold text-white">{botStats.activeBots}</p>
            </div>
            <Bot className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Comments</p>
              <p className="text-2xl font-bold text-white">{botStats.totalComments}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Engagement Rate</p>
              <p className="text-2xl font-bold text-white">{(botStats.engagementRate * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Bot Personalities Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Bot Personalities</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {botPersonalities.map((bot) => (
            <div
              key={bot.id}
              className={`
                bg-gray-800 rounded-lg p-4 border transition-all cursor-pointer
                ${selectedBot === bot.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                }
              `}
              onClick={() => setSelectedBot(bot.id)}
            >
              {/* Bot Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{getBotStyleIcon(bot.conversation_style)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{bot.name}</h3>
                  <p className={`text-sm ${getBotStyleColor(bot.conversation_style)}`}>
                    {bot.conversation_style.charAt(0).toUpperCase() + bot.conversation_style.slice(1)}
                  </p>
                </div>
                {selectedBot === bot.id && (
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                )}
              </div>

              {/* Bot Description */}
              <p className="text-gray-300 text-sm mb-3">{bot.description}</p>

              {/* Bot Expertise */}
              <div className="mb-3">
                <p className="text-gray-400 text-xs mb-1">Expertise Areas:</p>
                <div className="flex flex-wrap gap-1">
                  {bot.expertise_areas.map((area, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bot Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-gray-400">
                    {bot.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {bot.response_length} responses
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Bot Details */}
      {selectedBot && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">
              {getBotStyleIcon(
                botPersonalities.find(b => b.id === selectedBot)?.conversation_style || 'friendly'
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {botPersonalities.find(b => b.id === selectedBot)?.name}
              </h3>
              <p className="text-gray-400">
                Detailed performance and interaction history
              </p>
            </div>
          </div>

          {/* Bot Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Today&apos;s Interactions</p>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">This Week</p>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Total Lifetime</p>
            </div>
          </div>

          {/* Bot Actions */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              View Interaction History
            </button>
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Edit Personality
            </button>
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Performance Analytics
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowBotCreator(true)}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Create New Bot</p>
                <p className="text-sm text-gray-400">Design a custom AI personality</p>
              </div>
            </div>
          </button>

          <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">View Analytics</p>
                <p className="text-sm text-gray-400">Detailed performance insights</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bot Personality Creator Modal */}
      {showBotCreator && (
        <BotPersonalityCreator
          onBotCreated={(newBot) => {
            setBotPersonalities(prev => [...prev, newBot]);
            setShowBotCreator(false);
          }}
          onClose={() => setShowBotCreator(false)}
        />
      )}
    </div>
  );
}
