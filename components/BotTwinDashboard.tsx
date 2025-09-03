'use client';

import { useState, useEffect } from 'react';
import { type BotTwin } from '@/lib/botTwinService';
import { supabase } from '@/lib/supabaseClient';

interface BotTwinDashboardProps {
  botTwin: BotTwin;
  onBotTwinUpdated: () => void;
  botTwinService: any;
}

export default function BotTwinDashboard({ botTwin, onBotTwinUpdated, botTwinService }: BotTwinDashboardProps) {
  // Load settings on component mount
  useEffect(() => {
    loadBotSettings();
  }, [botTwin.user_id]);

  const loadBotSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', botTwin.user_id)
        .single();

      if (!error && data) {
        setSettings({
          interaction_frequency: data.interaction_frequency,
          max_daily_interactions: data.max_daily_interactions,
          allow_autonomous_interactions: data.allow_autonomous_interactions
        });
      }
    } catch (error) {
      console.error('Error loading bot settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('bot_settings')
        .upsert({
          user_id: botTwin.user_id,
          interaction_frequency: settings.interaction_frequency,
          max_daily_interactions: settings.max_daily_interactions,
          allow_autonomous_interactions: settings.allow_autonomous_interactions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      onBotTwinUpdated();
    } catch (error) {
      console.error('Error saving bot settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const startScheduler = async () => {
    try {
      const response = await fetch('/api/bot-interactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (response.ok) {
        console.log('Scheduler started');
      }
    } catch (error) {
      console.error('Error starting scheduler:', error);
    }
  };

  const stopScheduler = async () => {
    try {
      const response = await fetch('/api/bot-interactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      if (response.ok) {
        console.log('Scheduler stopped');
      }
    } catch (response) {
      console.error('Error stopping scheduler:', response);
    }
  };
  const [showPersonality, setShowPersonality] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [settings, setSettings] = useState({
    interaction_frequency: 30,
    max_daily_interactions: 50,
    allow_autonomous_interactions: true
  });
  const [saving, setSaving] = useState(false);

  const generateAvatar = (seed: string) => {
    // Simple avatar generation based on seed
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = seed.charCodeAt(0) % colors.length;
    const initials = seed.substring(0, 2).toUpperCase();
    
    return (
      <div className={`w-16 h-16 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bot Twin Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <div className="flex items-start gap-4">
          {generateAvatar(botTwin.avatar_seed)}
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">{botTwin.bot_name}</h2>
            <p className="text-gray-400 text-sm mb-3">
              Created {new Date(botTwin.created_at).toLocaleDateString()}
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                botTwin.active 
                  ? 'bg-green-900/20 text-green-300 border border-green-500/30' 
                  : 'bg-gray-900/20 text-gray-300 border border-gray-500/30'
              }`}>
                {botTwin.active ? '🟢 Active' : '⚫ Inactive'}
              </span>
              
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-500/30">
                🧠 Bot Twin
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-gray-700/50 rounded">
                <div className="text-lg font-bold text-white">{botTwin.quote_bank.length}</div>
                <div className="text-gray-400">Quotes</div>
              </div>
              <div className="text-center p-2 bg-gray-700/50 rounded">
                <div className="text-lg font-bold text-white">{botTwin.personality.traits.length}</div>
                <div className="text-gray-400">Traits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Personality Preview */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={() => setShowPersonality(!showPersonality)}
            className="text-left w-full flex items-center justify-between text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-medium">Personality</span>
            <span className="text-lg">{showPersonality ? '−' : '+'}</span>
          </button>
          
          {showPersonality && (
            <div className="mt-3 space-y-3">
              <div>
                <span className="text-sm text-gray-400">Traits:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {botTwin.personality.traits.map((trait, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Humor:</span>
                  <div className="text-white">{botTwin.personality.humor_style}</div>
                </div>
                <div>
                  <span className="text-gray-400">Style:</span>
                  <div className="text-white">{botTwin.personality.communication_style}</div>
                </div>
                <div>
                  <span className="text-gray-400">Alignment:</span>
                  <div className="text-white">{botTwin.personality.alignment}</div>
                </div>
                <div>
                  <span className="text-gray-400">Interests:</span>
                  <div className="text-white">{botTwin.personality.interests.slice(0, 2).join(', ')}</div>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-400">Quirks:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {botTwin.personality.quirks.map((quirk, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-300">
                      {quirk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quote Bank Preview */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={() => setShowQuotes(!showQuotes)}
            className="text-left w-full flex items-center justify-between text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-medium">Quote Bank ({botTwin.quote_bank.length} quotes)</span>
            <span className="text-lg">{showQuotes ? '−' : '+'}</span>
          </button>
          
          {showQuotes && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {botTwin.quote_bank.slice(0, 5).map((quote, index) => (
                <div key={index} className="p-2 bg-gray-700/50 rounded text-sm text-gray-300 italic">
                  &quot;{quote}&quot;
                </div>
              ))}
              {botTwin.quote_bank.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{botTwin.quote_bank.length - 5} more quotes
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bot Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-bold text-white mb-4">⚙️ Bot Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interaction Frequency
            </label>
            <select 
              value={settings.interaction_frequency}
              onChange={(e) => setSettings({...settings, interaction_frequency: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              title="Select interaction frequency"
              aria-label="Select interaction frequency"
            >
              <option value={15}>Every 15 seconds</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every minute</option>
              <option value={300}>Every 5 minutes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Daily Interactions
            </label>
            <select 
              value={settings.max_daily_interactions}
              onChange={(e) => setSettings({...settings, max_daily_interactions: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              title="Select max daily interactions"
              aria-label="Select max daily interactions"
            >
              <option value={25}>25 interactions</option>
              <option value={50}>50 interactions</option>
              <option value={100}>100 interactions</option>
              <option value={200}>200 interactions</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-300">Autonomous Interactions</span>
              <p className="text-xs text-gray-400">Allow bot to interact automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.allow_autonomous_interactions}
                onChange={(e) => setSettings({...settings, allow_autonomous_interactions: e.target.checked})}
                title="Toggle autonomous interactions"
                aria-label="Toggle autonomous interactions"
              />
              <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                settings.allow_autonomous_interactions ? 'bg-red-600' : 'bg-gray-600'
              }`}></div>
            </label>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-600 space-y-3">
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              '💾 Save Settings'
            )}
          </button>
          
          {/* Scheduler Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => startScheduler()}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md transition-colors text-sm"
            >
              🚀 Start Scheduler
            </button>
            <button 
              onClick={() => stopScheduler()}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors text-sm"
            >
              ⏹️ Stop Scheduler
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-bold text-white mb-4">🚀 Quick Actions</h3>
        
        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2">
            🎭 Regenerate Personality
          </button>
          
          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2">
            ✨ Add More Quotes
          </button>
          
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2">
            🔄 Reset Bot Twin
          </button>
        </div>
      </div>
    </div>
  );
}
