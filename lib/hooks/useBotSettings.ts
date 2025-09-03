'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';

interface BotSettings {
  user_id: string;
  autonomy_level: 'passive' | 'suggestive' | 'active';
  category_scope: string[];
  daily_save_cap: number;
  daily_react_cap: number;
  snoozed_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BotProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  description?: string;
  persona: {
    tone?: string;
    expertise?: string[];
    personality?: string;
  };
  created_at: string;
  updated_at: string;
}

interface UseBotSettingsReturn {
  settings: BotSettings | null;
  profile: BotProfile | null;
  isLoading: boolean;
  error: any;
  updateSettings: (updates: Partial<BotSettings>) => Promise<void>;
  updateProfile: (updates: Partial<BotProfile>) => Promise<void>;
  refreshSettings: () => void;
}

const fetcher = async (url: string): Promise<{ settings: BotSettings; profile: BotProfile }> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch bot settings');
  }
  return response.json();
};

export function useBotSettings(): UseBotSettingsReturn {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/bot/settings',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const updateSettings = useCallback(async (updates: Partial<BotSettings>) => {
    try {
      const response = await fetch('/api/bot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update bot settings');
      }

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to update bot settings:', error);
      throw error;
    }
  }, [mutate]);

  const updateProfile = useCallback(async (updates: Partial<BotProfile>) => {
    try {
      const response = await fetch('/api/bot/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update bot profile');
      }

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to update bot profile:', error);
      throw error;
    }
  }, [mutate]);

  const refreshSettings = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    settings: data?.settings || null,
    profile: data?.profile || null,
    isLoading,
    error,
    updateSettings,
    updateProfile,
    refreshSettings
  };
}
