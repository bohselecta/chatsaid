'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

interface BotReport {
  id: number;
  kind: 'found_cherry' | 'follow_suggestion' | 'reply_suggestion' | 'save_suggestion' | 'react_suggestion';
  payload: {
    cherry_id?: string;
    cherry_title?: string;
    cherry_content?: string;
    cherry_author?: string;
    bot_id?: string;
    bot_name?: string;
    reply_text?: string;
    confidence?: number;
    reason?: string;
    category?: string;
    tags?: string[];
  };
  status: 'pending' | 'approved' | 'dismissed' | 'expired';
  confidence_score: number;
  created_at: string;
  seen_at?: string;
  responded_at?: string;
}

interface UseBotReportsReturn {
  reports: BotReport[];
  unreadCount: number;
  isLoading: boolean;
  error: any;
  markAsSeen: () => Promise<void>;
  approveReport: (reportId: number) => Promise<void>;
  dismissReport: (reportId: number) => Promise<void>;
  refreshReports: () => void;
}

const fetcher = async (url: string): Promise<BotReport[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch bot reports');
  }
  const data = await response.json();
  return data.reports || [];
};

export function useBotReports(): UseBotReportsReturn {
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: reports = [], error, isLoading, mutate } = useSWR<BotReport[]>(
    '/api/bot/reports',
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    }
  );

  // Calculate unread count
  useEffect(() => {
    const unread = reports.filter(report => 
      report.status === 'pending' && !report.seen_at
    ).length;
    setUnreadCount(unread);
  }, [reports]);

  const markAsSeen = useCallback(async () => {
    try {
      const unseenReports = reports.filter(report => 
        report.status === 'pending' && !report.seen_at
      );

      if (unseenReports.length === 0) return;

      // Mark all unseen reports as seen
      await Promise.all(
        unseenReports.map(report =>
          fetch('/api/bot/reports', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId: report.id,
              action: 'mark_seen'
            })
          })
        )
      );

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to mark reports as seen:', error);
    }
  }, [reports, mutate]);

  const approveReport = useCallback(async (reportId: number) => {
    try {
      const response = await fetch('/api/bot/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          decision: 'approve'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve report');
      }

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to approve report:', error);
      throw error;
    }
  }, [mutate]);

  const dismissReport = useCallback(async (reportId: number) => {
    try {
      const response = await fetch('/api/bot/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          decision: 'dismiss'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss report');
      }

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to dismiss report:', error);
      throw error;
    }
  }, [mutate]);

  const refreshReports = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    reports,
    unreadCount,
    isLoading,
    error,
    markAsSeen,
    approveReport,
    dismissReport,
    refreshReports
  };
}
