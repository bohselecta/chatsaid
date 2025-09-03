'use client';

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SafetyDotProps {
  content: string;
  contentType?: 'cherry' | 'comment' | 'profile';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface SafetyResult {
  status: 'green' | 'yellow' | 'red';
  reason: string;
  violations: any[];
  confidence: number;
}

export default function SafetyDot({ 
  content, 
  contentType = 'cherry', 
  className,
  size = 'md'
}: SafetyDotProps) {
  const [safetyStatus, setSafetyStatus] = useState<'green' | 'yellow' | 'red'>('green');
  const [reason, setReason] = useState('Looking good! 🌱');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return '🌱';
      case 'yellow': return '🍋';
      case 'red': return '🍒';
      default: return '🌱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const checkSafety = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setSafetyStatus('green');
      setReason('Looking good! 🌱');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/safety/checkDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, contentType })
      });

      if (response.ok) {
        const result: SafetyResult = await response.json();
        setSafetyStatus(result.status);
        setReason(result.reason);
        setLastCheck(new Date());
      } else {
        setSafetyStatus('green');
        setReason('Safety check unavailable');
      }
    } catch (error) {
      console.error('Safety check failed:', error);
      setSafetyStatus('green');
      setReason('Safety check unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    if (!content.trim()) {
      setSafetyStatus('green');
      setReason('Looking good! 🌱');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkSafety(content);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [content, checkSafety]);

  useEffect(() => {
    if (!content.trim() || content.length < 3) return;

    const intervalId = setInterval(() => {
      checkSafety(content);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [content, checkSafety]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'relative cursor-pointer transition-all duration-300 ease-in-out',
            className
          )}
        >
          {/* Main Safety Dot */}
          <div
            className={cn(
              'rounded-full border-2 border-white shadow-lg transition-all duration-300',
              sizeClasses[size],
              getStatusColor(safetyStatus),
              isLoading && 'animate-pulse',
              safetyStatus === 'green' && 'animate-pulse',
              safetyStatus === 'yellow' && 'animate-bounce',
              safetyStatus === 'red' && 'animate-ping'
            )}
          />
          
          {/* Cherry Stem Animation for Green */}
          {safetyStatus === 'green' && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="w-0.5 h-2 bg-green-600 rounded-full animate-pulse" />
            </div>
          )}
          
          {/* Wilted Cherry Animation for Red */}
          {safetyStatus === 'red' && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="w-0.5 h-2 bg-red-600 rounded-full animate-bounce opacity-50" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-64 p-3 bg-gray-800 border-gray-600 text-white"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(safetyStatus)}</span>
            <span className="font-medium">
              {safetyStatus === 'green' && 'Safe to Post'}
              {safetyStatus === 'yellow' && 'Use Caution'}
              {safetyStatus === 'red' && 'Will Be Punted'}
            </span>
          </div>
          
          <p className="text-sm text-gray-300">{reason}</p>
          
          {lastCheck && (
            <p className="text-xs text-gray-400">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
          
          {safetyStatus === 'yellow' && (
            <div className="text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded">
              💡 Tip: Consider softening your tone or rephrasing
            </div>
          )}
          
          {safetyStatus === 'red' && (
            <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded">
              🚫 This content violates community guidelines
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

