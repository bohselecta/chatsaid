'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Clock, Zap } from 'lucide-react';

interface AgentWakeButtonProps {
  userId: string;
  onDigestReady: (digest: any) => void;
  className?: string;
}

export default function AgentWakeButton({ 
  userId, 
  onDigestReady, 
  className = '' 
}: AgentWakeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const handleWake = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/agent/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Optionally specify time window
          // windowStart: lastChecked?.toISOString(),
          // windowEnd: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate digest');
      }

      const { digest } = await response.json();
      setLastChecked(new Date());
      onDigestReady(digest);
      
    } catch (error) {
      console.error('Wake agent error:', error);
      // Handle error - could show toast notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <button
        onClick={handleWake}
        disabled={loading}
        className={`
          group relative overflow-hidden rounded-xl px-8 py-4 font-semibold text-white
          transition-all duration-300 ease-out
          ${loading 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-cherry-500 to-cherry-600 hover:from-cherry-600 hover:to-cherry-700 shadow-lg hover:shadow-xl hover:scale-105'
          }
        `}
      >
        {/* Background animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-cherry-400 to-cherry-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative flex items-center space-x-3">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              <span>Find anything while I was asleep?</span>
            </>
          )}
        </div>

        {/* Ripple effect */}
        {loading && (
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
        )}
      </button>

      {/* Status indicator */}
      {lastChecked && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Quick stats preview */}
      <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span>AI-powered</span>
        </div>
        <div className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>Personalized</span>
        </div>
      </div>
    </div>
  );
}
