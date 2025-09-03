'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PuntInfo {
  is_punted: boolean;
  level?: string;
  reason?: string;
  custom_message?: string;
  expires_at?: string;
  time_remaining_minutes?: number;
}

interface PuntNotificationProps {
  userId: string;
}

export default function PuntNotification({ userId }: PuntNotificationProps) {
  const [puntInfo, setPuntInfo] = useState<PuntInfo>({ is_punted: false });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    checkPuntStatus();
    const interval = setInterval(checkPuntStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (puntInfo.is_punted && puntInfo.time_remaining_minutes) {
      setTimeRemaining(puntInfo.time_remaining_minutes);
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            checkPuntStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [puntInfo.is_punted, puntInfo.time_remaining_minutes]);

  const checkPuntStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_user_punted', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setPuntInfo({
          is_punted: true,
          level: data[0].level,
          reason: data[0].reason,
          custom_message: data[0].custom_message,
          expires_at: data[0].expires_at,
          time_remaining_minutes: data[0].time_remaining_minutes
        });
      } else {
        setPuntInfo({ is_punted: false });
      }
    } catch (error) {
      console.error('Error checking punt status:', error);
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

  const getPuntTitle = (level: string) => {
    switch (level) {
      case 'seed': return 'Seed Punt';
      case 'sprout': return 'Sprout Punt';
      case 'cherry': return 'Cherry Punt';
      case 'tree': return 'Tree Punt';
      default: return 'Punt';
    }
  };

  const getPuntColor = (level: string) => {
    switch (level) {
      case 'seed': return 'from-green-500 to-emerald-500';
      case 'sprout': return 'from-yellow-500 to-orange-500';
      case 'cherry': return 'from-red-500 to-pink-500';
      case 'tree': return 'from-purple-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  const submitAppeal = async () => {
    if (!appealText.trim()) return;

    setSubmittingAppeal(true);
    try {
      // Update the punt with appeal text
      const { error } = await supabase
        .from('punts')
        .update({ 
          appeal_text: appealText.trim(),
          appeal_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      setShowAppeal(false);
      setAppealText('');
      // You could show a success message here
    } catch (error) {
      console.error('Error submitting appeal:', error);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (!puntInfo.is_punted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br ${getPuntColor(puntInfo.level || 'seed')} rounded-2xl p-8 max-w-md w-full text-center text-white shadow-2xl`}>
        {/* Punt Icon */}
        <div className="text-6xl mb-4">
          {getPuntIcon(puntInfo.level || 'seed')}
        </div>

        {/* Punt Title */}
        <h2 className="text-2xl font-bold mb-2">
          {getPuntTitle(puntInfo.level || 'seed')}
        </h2>

        {/* Custom Message */}
        {puntInfo.custom_message && (
          <p className="text-lg mb-4 font-medium">
            {puntInfo.custom_message}
          </p>
        )}

        {/* Reason */}
        {puntInfo.reason && (
          <div className="bg-white/20 rounded-lg p-3 mb-4">
            <p className="text-sm opacity-90">
              <strong>Reason:</strong> {puntInfo.reason.replace('_', ' ')}
            </p>
          </div>
        )}

        {/* Time Remaining */}
        <div className="bg-white/20 rounded-lg p-4 mb-6">
          <p className="text-sm opacity-90 mb-2">Time remaining:</p>
          <p className="text-2xl font-bold">
            {formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {/* Appeal Section */}
        {!showAppeal ? (
          <button
            onClick={() => setShowAppeal(true)}
            className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm"
          >
            📝 Appeal this punt
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Explain why you think this punt was unfair..."
              className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowAppeal(false)}
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitAppeal}
                disabled={!appealText.trim() || submittingAppeal}
                className="bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
              >
                {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        )}

        {/* Fun Message */}
        <div className="mt-6 text-sm opacity-80">
          <p>🌱 Take this time to reflect and grow!</p>
          <p>✨ You&apos;ll be back before you know it!</p>
        </div>
      </div>
    </div>
  );
}
