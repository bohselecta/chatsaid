'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import MindMapVisualizer from '@/components/MindMapVisualizer';
import { createAIInsightsService, type InsightResult } from '@/lib/aiInsights';

interface Cherry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  branch_type: string;
  twig_name?: string;
  source_file?: string;
  line_number?: number;
  image_url?: string;
  review_status: string;
}

export default function MindMapPage() {
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCherry, setSelectedCherry] = useState<Cherry | null>(null);
  const [insightMode, setInsightMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [insights, setInsights] = useState<InsightResult | null>(null);
  

  const router = useRouter();

  useEffect(() => {
    checkUserAndLoadCherries();
  }, []);

  const checkUserAndLoadCherries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      await loadUserCherries(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const loadUserCherries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cherries_view')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCherries(data || []);
    } catch (error) {
      console.error('Error loading cherries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsights = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your API key to get AI insights');
      return;
    }

    setInsightMode(true);
    
    try {
      const insightsService = createAIInsightsService(apiKey);
      const result = await insightsService.analyzeCherries(cherries);
      setInsights(result);
    } catch (error) {
      console.error('Error getting insights:', error);
      alert('Failed to get insights. Please check your API key and try again.');
    } finally {
      setInsightMode(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your mind map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">🧠 Your Mind Map</h1>
          <p className="text-gray-300 mt-2">
            Explore your cherries and discover insights about your AI conversations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-2xl font-bold text-red-500">{cherries.length}</div>
            <div className="text-gray-300">Total Cherries</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-2xl font-bold text-blue-500">
              {new Set(cherries.map(c => c.branch_type)).size}
            </div>
            <div className="text-gray-300">Branches Explored</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-2xl font-bold text-green-500">
              {cherries.filter(c => c.review_status === 'reviewed').length}
            </div>
            <div className="text-gray-300">Reviewed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="text-2xl font-bold text-purple-500">
              {cherries.filter(c => c.image_url).length}
            </div>
            <div className="text-gray-300">With Images</div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">🤖 AI Insights</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="password"
              placeholder="Enter your API key for AI insights"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={getInsights}
              disabled={insightMode}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              {insightMode ? 'Analyzing...' : 'Get Insights'}
            </button>
          </div>

          {insights && (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="text-sm text-gray-300 mb-2">AI Analysis:</div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">📊 Summary</h4>
                  <p className="text-gray-300 text-sm">{insights.summary}</p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">🔍 Patterns Discovered</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {insights.patterns.map((pattern, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">🎯 Suggested Goals</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {insights.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">🔗 Key Connections</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {insights.connections.map((connection, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        {connection}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">💡 Recommendations</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {insights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mind Map Visualization */}
        {cherries.length > 0 && (
          <div className="mb-8">
            <MindMapVisualizer 
              cherries={cherries} 
              onCherrySelect={(cherry) => setSelectedCherry(selectedCherry?.id === cherry.id ? null : cherry)} 
            />
          </div>
        )}

        {/* Cherry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cherries.map((cherry) => (
            <div
              key={cherry.id}
              onClick={() => setSelectedCherry(selectedCherry?.id === cherry.id ? null : cherry)}
              className={`bg-gray-800 rounded-lg p-6 border border-gray-600 cursor-pointer transition-all hover:border-red-500 ${
                selectedCherry?.id === cherry.id ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cherry.branch_type === 'funny' ? 'bg-yellow-500/20 text-yellow-400' :
                  (cherry.branch_type === 'mystical' || cherry.branch_type === 'weird') ? 'bg-purple-500/20 text-purple-400' :
                  cherry.branch_type === 'technical' ? 'bg-blue-500/20 text-blue-400' :
                  cherry.branch_type === 'research' ? 'bg-green-500/20 text-green-400' :
                  cherry.branch_type === 'ideas' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {cherry.branch_type}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(cherry.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-semibold text-white mb-2 line-clamp-2">
                {cherry.title || 'Untitled Cherry'}
              </h3>
              
              <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                {cherry.content}
              </p>

              {cherry.source_file && (
                <div className="text-xs text-gray-400 mb-2">
                  📁 {cherry.source_file}
                  {cherry.line_number && `:${cherry.line_number}`}
                </div>
              )}

              {cherry.image_url && (
                <div className="text-xs text-gray-400 mb-2">
                  🖼️ Has image
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded ${
                  cherry.review_status === 'reviewed' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {cherry.review_status}
                </span>
                {cherry.twig_name && (
                  <span className="text-gray-400">🌿 {cherry.twig_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {cherries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No cherries yet!</div>
            <p className="text-gray-500 mb-6">
              Start creating posts to build your mind map and discover insights
            </p>
            <button
              onClick={() => router.push('/canopy')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Cherry
            </button>
          </div>
        )}
      </div>

      {/* Cherry Detail Modal */}
      {selectedCherry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Cherry Details</h2>
                <button
                  onClick={() => setSelectedCherry(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <div className="text-white font-medium">
                    {selectedCherry.title || 'Untitled Cherry'}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Content</label>
                  <div className="text-white bg-gray-700 p-3 rounded border border-gray-600">
                    {selectedCherry.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Branch</label>
                    <div className="text-white">{selectedCherry.branch_type}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Created</label>
                    <div className="text-white">
                      {new Date(selectedCherry.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {selectedCherry.source_file && (
                  <div>
                    <label className="text-sm text-gray-400">Source</label>
                    <div className="text-white">
                      {selectedCherry.source_file}
                      {selectedCherry.line_number && `:${selectedCherry.line_number}`}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                                     <button
                     onClick={() => router.push(`/cherry/${selectedCherry.id}`)}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                   >
                     View Full Cherry
                   </button>
                  <button
                    onClick={() => router.push(`/branch/${selectedCherry.branch_type}`)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    Explore Branch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
