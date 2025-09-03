'use client';

import { useCallback } from 'react';
import { useBot } from '@/components/bot/BotProvider';

interface CherryData {
  id: string;
  title?: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  author_id?: string;
}

interface UseBotIntegrationReturn {
  triggerSaveProposal: (cherry: CherryData, category: string) => Promise<void>;
  triggerFollowProposal: (botId: string, botName: string) => Promise<void>;
  triggerReplyProposal: (cherryId: string, replyText: string) => Promise<void>;
  triggerReactProposal: (cherryId: string, reactionType: string) => Promise<void>;
}

export function useBotIntegration(): UseBotIntegrationReturn {
  const { openBot } = useBot();

  const triggerSaveProposal = useCallback(async (cherry: CherryData, category: string) => {
    try {
      const response = await fetch('/api/bot/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'save_suggestion',
          payload: {
            cherry_id: cherry.id,
            cherry_title: cherry.title,
            cherry_content: cherry.content,
            cherry_author: cherry.author,
            category,
            tags: cherry.tags,
            reason: `You picked this cherry for your ${category} collection`,
            confidence: 0.9
          },
          confidence_score: 0.9
        })
      });

      if (response.ok) {
        // Open the bot to show the new proposal
        openBot();
      }
    } catch (error) {
      console.error('Failed to trigger save proposal:', error);
    }
  }, [openBot]);

  const triggerFollowProposal = useCallback(async (botId: string, botName: string) => {
    try {
      const response = await fetch('/api/bot/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'follow_suggestion',
          payload: {
            bot_id: botId,
            bot_name: botName,
            reason: `You've interacted with ${botName} multiple times`,
            confidence: 0.8
          },
          confidence_score: 0.8
        })
      });

      if (response.ok) {
        openBot();
      }
    } catch (error) {
      console.error('Failed to trigger follow proposal:', error);
    }
  }, [openBot]);

  const triggerReplyProposal = useCallback(async (cherryId: string, replyText: string) => {
    try {
      const response = await fetch('/api/bot/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'reply_suggestion',
          payload: {
            cherry_id: cherryId,
            reply_text: replyText,
            reason: 'AI-generated reply suggestion based on cherry content',
            confidence: 0.7
          },
          confidence_score: 0.7
        })
      });

      if (response.ok) {
        openBot();
      }
    } catch (error) {
      console.error('Failed to trigger reply proposal:', error);
    }
  }, [openBot]);

  const triggerReactProposal = useCallback(async (cherryId: string, reactionType: string) => {
    try {
      const response = await fetch('/api/bot/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'react_suggestion',
          payload: {
            cherry_id: cherryId,
            reaction_type: reactionType,
            reason: `Suggested ${reactionType} reaction based on content analysis`,
            confidence: 0.6
          },
          confidence_score: 0.6
        })
      });

      if (response.ok) {
        openBot();
      }
    } catch (error) {
      console.error('Failed to trigger react proposal:', error);
    }
  }, [openBot]);

  return {
    triggerSaveProposal,
    triggerFollowProposal,
    triggerReplyProposal,
    triggerReactProposal
  };
}
