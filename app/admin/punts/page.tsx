'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createContentSafetyService } from '@/lib/contentSafetyService';

interface Punt {
  id: string;
  user_id: string;
  user_email: string;
  punter_name: string;
  punter_is_bot: boolean;
  level: string;
  reason: string;
  custom_message: string;
  duration_minutes: number;
  expires_at: string;
  is_active: boolean;
  appeal_text: string | null;
  appeal_status: string;
  created_at: string;
}

interface PuntStats {
  level: string;
  total_punts: number;
  active_punts: number;
  avg_duration_minutes: number;
  spam_punts: number;
  toxic_punts: number;
  harmful_punts: number;
}

export default function AdminPuntsPage() {
  const [punts, setPunts] = useState<Punt[]>([]);
  const [stats, setStats] = useState<PuntStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedPunt, setSelectedPunt] = useState<Punt | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealResponse, setAppealResponse] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [safetyService, setSafetyService] = useState<any>(null);

  useEffect(() => {
    loadPunts();
    loadStats();
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSafetyService(createContentSafetyService(savedApiKey));
    }
  }, []);

  const loadPunts = async () => {
    try {
      const { data, error } = await supabase
        .from('active_punts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPunts(data || []);
    } catch (error) {
      console.error('Error loading punts:', error);
      setMessage('❌ Error loading punts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('punt_stats')
        .select('*');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('openai_api_key', key);
    if (key) {
      setSafetyService(createContentSafetyService(key));
    }
  };

  const expirePunt = async (puntId: string) => {
    try {
      const { error } = await supabase
        .from('punts')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', puntId);

      if (error) throw error;

      setMessage('✅ Punt expired successfully');
      loadPunts();
      loadStats();
    } catch (error) {
      console.error('Error expiring punt:', error);
      setMessage('❌ Error expiring punt');
    }
  };

  const handleAppeal = async (puntId: string, status: 'approved' | 'rejected') => {
    if (!appealResponse.trim()) {
      setMessage('Please provide a response to the appeal');
      return;
    }

    try {
      const { error } = await supabase
        .from('punts')
        .update({ 
          appeal_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', puntId);

      if (error) throw error;

      // Add to history
      await supabase
        .from('punt_history')
        .insert({
          user_id: selectedPunt?.user_id,
          punt_id: puntId,
          action: `appeal_${status}`
        });

      setMessage(`✅ Appeal ${status} successfully`);
      setShowAppealModal(false);
      setSelectedPunt(null);
      setAppealResponse('');
      loadPunts();
    } catch (error) {
      console.error('Error handling appeal:', error);
      setMessage('❌ Error handling appeal');
    }
  };

  const getPuntIcon = (level: string) => {
    switch (level) {
      case 'seed': return '🌱';
      case 'sprout': return '🌿';
      case 'cherry': return '🍒';
      case 'tree': return '🌳';
      default: return '🌱';
    }
  };

  const getPuntColor = (level: string) => {
    switch (level) {
      case 'seed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sprout': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cherry': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'tree': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAppealStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">🍒 Cherry Punt System</h1>
          <p className="text-gray-300 mt-2">
            AI-powered content safety with style - manage punts, appeals, and community safety
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* API Key Setup */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">🔑 OpenAI API Key</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-2">API Key for Content Safety Analysis</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={() => handleApiKeyChange('')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            This key enables AI-powered content analysis and automatic safety detection
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.level} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm capitalize">{stat.level} Punts</p>
                  <p className="text-2xl font-bold text-white">{stat.active_punts}</p>
                  <p className="text-sm text-gray-400">of {stat.total_punts} total</p>
                </div>
                <div className="text-3xl">{getPuntIcon(stat.level)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Punts */}
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">🚫 Active Punts</h2>
            <p className="text-gray-300 text-sm mt-1">
              Currently active punts and their status
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white font-medium">User</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Level</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Reason</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Punter</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Time Left</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Appeal</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Loading punts...
                    </td>
                  </tr>
                ) : punts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No active punts - the community is behaving well! 🌱✨
                    </td>
                  </tr>
                ) : (
                  punts.map((punt) => (
                    <tr key={punt.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-white font-medium">{punt.user_email}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(punt.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm border ${getPuntColor(punt.level)}`}>
                          {getPuntIcon(punt.level)} {punt.level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="text-white text-sm mb-1">
                            {punt.reason.replace('_', ' ')}
                          </div>
                          {punt.custom_message && (
                            <div className="text-gray-300 text-xs italic">
                              &quot;{punt.custom_message}&quot;
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{punt.punter_name}</span>
                          {punt.punter_is_bot && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                              🤖 AI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">
                          {formatTimeRemaining(punt.expires_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {punt.appeal_text ? (
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getAppealStatusColor(punt.appeal_status)}`}>
                              {punt.appeal_status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedPunt(punt);
                                setShowAppealModal(true);
                              }}
                              className="block text-xs text-blue-400 hover:text-blue-300 mt-1"
                            >
                              View & Respond
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No appeal</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => expirePunt(punt.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                            title="Expire this punt early"
                          >
                            ✅ Expire
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-white">{message}</p>
          </div>
        )}
      </div>

      {/* Appeal Response Modal */}
      {showAppealModal && selectedPunt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">
              Appeal Response - {selectedPunt.user_email}
            </h3>
            
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">User&apos;s Appeal:</h4>
              <div className="bg-gray-700 rounded-lg p-3 text-gray-300">
                {selectedPunt.appeal_text}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Your Response:</label>
              <textarea
                value={appealResponse}
                onChange={(e) => setAppealResponse(e.target.value)}
                placeholder="Provide a response to the user's appeal..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAppealModal(false);
                  setSelectedPunt(null);
                  setAppealResponse('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAppeal(selectedPunt.id, 'rejected')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Reject Appeal
              </button>
              <button
                onClick={() => handleAppeal(selectedPunt.id, 'approved')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Approve Appeal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
