'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createScheduledPostingService } from '@/lib/scheduledPostingService';
import { botProfileService } from '@/lib/botProfiles';

interface BotStats {
  totalPosts: number;
  lastPost: string | null;
  nextPost: string | null;
}

export default function BotAdminPage() {
  const [apiKey, setApiKey] = useState('');
  const [isPostingActive, setIsPostingActive] = useState(false);
  const [botStats, setBotStats] = useState<Record<string, BotStats>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBotStats();
  }, []);

  const loadBotStats = async () => {
    try {
      const { data: cherries } = await supabase
        .from('cherries')
        .select('*')
        .in('author_id', ['cherry_ent_bot', 'crystal_maize_bot'])
        .order('created_at', { ascending: false });

      const stats: Record<string, BotStats> = {};
      
      ['cherry_ent_bot', 'crystal_maize_bot'].forEach(botId => {
        const botCherries = cherries?.filter(c => c.author_id === botId) || [];
        stats[botId] = {
          totalPosts: botCherries.length,
          lastPost: botCherries[0]?.created_at || null,
          nextPost: null // This would come from the scheduling service
        };
      });

      setBotStats(stats);
    } catch (error) {
      console.error('Error loading bot stats:', error);
    }
  };

  const startScheduledPosting = async () => {
    if (!apiKey.trim()) {
      setMessage('Please enter your OpenAI API key');
      return;
    }

    setLoading(true);
    try {
      const postingService = createScheduledPostingService(apiKey);
      await postingService.startScheduledPosting();
      setIsPostingActive(true);
      setMessage('✅ Scheduled posting started successfully!');
    } catch (error) {
      console.error('Error starting scheduled posting:', error);
      setMessage('❌ Error starting scheduled posting');
    } finally {
      setLoading(false);
    }
  };

  const stopScheduledPosting = async () => {
    setLoading(true);
    try {
      // In a real implementation, you'd store the service instance
      // For now, we'll just update the state
      setIsPostingActive(false);
      setMessage('🛑 Scheduled posting stopped');
    } catch (error) {
      console.error('Error stopping scheduled posting:', error);
      setMessage('❌ Error stopping scheduled posting');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualPost = async (personaId: string, category: string) => {
    if (!apiKey.trim()) {
      setMessage('Please enter your OpenAI API key');
      return;
    }

    setLoading(true);
    try {
      const postingService = createScheduledPostingService(apiKey);
      const success = await postingService.triggerManualPost(personaId, category);
      
      if (success) {
        setMessage(`✅ Manual post created for ${personaId} in ${category} category`);
        loadBotStats(); // Refresh stats
      } else {
        setMessage('❌ Failed to create manual post');
      }
    } catch (error) {
      console.error('Error creating manual post:', error);
      setMessage('❌ Error creating manual post');
    } finally {
      setLoading(false);
    }
  };

  const getBotDisplayName = (botId: string) => {
    return botId === 'cherry_ent_bot' ? 'Cherry Ent 🌳' : 'Crystal Maize ✨';
  };

  const getBotDescription = (botId: string) => {
    return botId === 'cherry_ent_bot' 
      ? 'Casual, witty, and secretly brilliant tree spirit'
      : 'Poetic soul with activist fire';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">🤖 AI Bot Administration</h1>
          <p className="text-gray-300 mt-2">
            Manage Cherry_Ent and Crystal_Maize - your ChatSaid house band
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* API Key Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">🔑 OpenAI API Configuration</h2>
          <div className="flex gap-4">
            <input
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={startScheduledPosting}
              disabled={loading || isPostingActive}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Starting...' : 'Start Scheduled Posting'}
            </button>
            <button
              onClick={stopScheduledPosting}
              disabled={loading || !isPostingActive}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Stop Posting
            </button>
          </div>
          {message && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-white">{message}</p>
            </div>
          )}
        </div>

        {/* Bot Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {['cherry_ent_bot', 'crystal_maize_bot'].map((botId) => (
            <div key={botId} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  {botId === 'cherry_ent_bot' ? '🌳' : '✨'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {getBotDisplayName(botId)}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {getBotDescription(botId)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Posts:</span>
                  <span className="text-white font-semibold">
                    {botStats[botId]?.totalPosts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Post:</span>
                  <span className="text-white text-sm">
                    {botStats[botId]?.lastPost 
                      ? new Date(botStats[botId].lastPost!).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Manual Post Triggers:</h4>
                {botId === 'cherry_ent_bot' ? (
                  <>
                    <button
                      onClick={() => triggerManualPost('cherry_ent', 'funny')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      🎭 Funny Post
                    </button>
                    <button
                      onClick={() => triggerManualPost('cherry_ent', 'technical')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      ⚡ Technical Post
                    </button>
                    <button
                      onClick={() => triggerManualPost('cherry_ent', 'ideas')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      💡 Ideas Post
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => triggerManualPost('crystal_maize', 'weird')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      ✨ Mystical Post
                    </button>
                    <button
                      onClick={() => triggerManualPost('crystal_maize', 'research')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      🔬 Research Post
                    </button>
                    <button
                      onClick={() => triggerManualPost('crystal_maize', 'ideas')}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      💡 Ideas Post
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Posting Schedule Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold text-white mb-4">📅 Posting Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Cherry Ent 🌳</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Funny: Daily</li>
                <li>• Technical: Daily (12h offset)</li>
                <li>• Ideas: Daily (18h offset)</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Crystal Maize ✨</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Mystical: Daily (6h offset)</li>
                <li>• Research: Daily (14h offset)</li>
                <li>• Ideas: Daily (20h offset)</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">System Info</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Check interval: 30 minutes</li>
                <li>• Randomization: 18-30 hours</li>
                <li>• Status: {isPostingActive ? '🟢 Active' : '🔴 Inactive'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Bot Posts */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">📝 Recent Bot Posts</h2>
          <div className="space-y-4">
            {/* This would show recent bot posts */}
            <p className="text-gray-400 text-center py-8">
              Recent bot posts will appear here once the system is running
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
