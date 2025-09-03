'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createBotTwinService, type BotTwin, type BotInteraction } from '@/lib/botTwinService';
import BotTwinCreator from '@/components/BotTwinCreator';
import BotTwinDashboard from '@/components/BotTwinDashboard';
import BotInteractionFeed from '@/components/BotInteractionFeed';

export default function BotTwinPage() {
  const [user, setUser] = useState<any>(null);
  const [botTwin, setBotTwin] = useState<BotTwin | null>(null);
  const [interactions, setInteractions] = useState<BotInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [botTwinService, setBotTwinService] = useState<any>(null);
  const [scheduler, setScheduler] = useState<any>(null);

  useEffect(() => {
    checkUser();
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setBotTwinService(createBotTwinService(savedApiKey));
    }
  }, []);

  useEffect(() => {
    if (user && botTwinService) {
      loadBotTwin();
      loadInteractions();
    }
  }, [user, botTwinService]);

  // Cleanup scheduler on unmount
  useEffect(() => {
    return () => {
      if (scheduler) {
        scheduler.stop();
      }
    };
  }, [scheduler]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const loadBotTwin = async () => {
    if (!botTwinService) return;
    
    try {
      const twin = await botTwinService.getUserBotTwin(user.id);
      setBotTwin(twin);
    } catch (error) {
      console.error('Error loading bot twin:', error);
    }
  };

  const loadInteractions = async () => {
    if (!botTwinService) return;
    
    try {
      const feed = await botTwinService.getBotInteractionFeed(100);
      setInteractions(feed);
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('openai_api_key', key);
    const service = createBotTwinService(key);
    setBotTwinService(service);
    
    // Initialize scheduler with the new API key
    if (key) {
      const { BotInteractionScheduler } = require('@/lib/botInteractionScheduler');
      const newScheduler = new BotInteractionScheduler(key);
      setScheduler(newScheduler);
      
      // Start the scheduler
      newScheduler.start();
    }
  };

  const handleBotTwinCreated = (newBotTwin: BotTwin) => {
    setBotTwin(newBotTwin);
    loadInteractions();
  };

  const handleBotTwinUpdated = () => {
    loadBotTwin();
    loadInteractions();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading Bot Twin System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🧠 Bot Twin System</h1>
          <p className="text-gray-400 mb-4">Please log in to access your bot twin</p>
          <a 
            href="/login" 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🧠 Bot Twin System</h1>
              <p className="text-gray-400 mt-2">
                Create your AI persona and watch it interact with other bots
              </p>
            </div>
            
            {/* API Key Setup */}
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="sk-..."
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for bot generation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bot Twin Management */}
          <div className="lg:col-span-1 space-y-6">
            {!botTwin ? (
              <BotTwinCreator 
                apiKey={apiKey}
                onBotTwinCreated={handleBotTwinCreated}
                botTwinService={botTwinService}
              />
            ) : (
              <BotTwinDashboard 
                botTwin={botTwin}
                onBotTwinUpdated={handleBotTwinUpdated}
                botTwinService={botTwinService}
              />
            )}
          </div>

          {/* Right Column - Interaction Feed */}
          <div className="lg:col-span-2">
            <BotInteractionFeed 
              interactions={interactions}
              currentBotTwin={botTwin}
              onInteractionCreated={loadInteractions}
              botTwinService={botTwinService}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
