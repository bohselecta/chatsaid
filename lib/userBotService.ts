import { supabase } from './supabaseClient';

export interface UserBot {
  id: string;
  user_id: string;
  bot_id: string;
  personality_traits: string[];
  learning_enabled: boolean;
  interaction_history: any[];
  created_at: string;
  updated_at: string;
}

export interface BotPersonality {
  id: string;
  name: string;
  description: string;
  conversation_style: 'friendly' | 'professional' | 'casual' | 'philosophical' | 'humorous';
  expertise_areas: string[];
  response_length: 'short' | 'medium' | 'long';
  avatar_url?: string;
}

export class UserBotService {
  /**
   * Create a user bot for a new user
   */
  static async createUserBot(userId: string): Promise<UserBot | null> {
    try {
      // Create a bot profile for the user
      const botProfile = await supabase
        .from('profiles')
        .insert({
          id: `user_bot_${userId}`,
          display_name: 'My Bot Twin',
          bio: 'A personalized AI companion that learns from your interactions',
          avatar_url: '/default-bot-avatar.png',
          is_bot: true,
          bot_type: 'user_bot',
          is_public: false
        })
        .select()
        .single();

      if (botProfile.error) throw botProfile.error;

      // Create the user bot record
      const { data, error } = await supabase
        .from('user_bots')
        .insert({
          user_id: userId,
          bot_id: botProfile.data.id,
          personality_traits: ['friendly', 'helpful', 'curious'],
          learning_enabled: true,
          interaction_history: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user bot:', error);
      return null;
    }
  }

  /**
   * Get a user's bot
   */
  static async getUserBot(userId: string): Promise<UserBot | null> {
    try {
      const { data, error } = await supabase
        .from('user_bots')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user bot:', error);
      return null;
    }
  }

  /**
   * Update bot personality traits
   */
  static async updateBotPersonality(
    userId: string, 
    personalityTraits: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_bots')
        .update({ 
          personality_traits: personalityTraits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating bot personality:', error);
      return false;
    }
  }

  /**
   * Toggle bot learning
   */
  static async toggleBotLearning(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_bots')
        .update({ 
          learning_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling bot learning:', error);
      return false;
    }
  }

  /**
   * Record bot interaction for learning
   */
  static async recordBotInteraction(
    userId: string, 
    interaction: {
      type: string;
      target_id: string;
      target_type: string;
      success_score: number;
      context: any;
    }
  ): Promise<boolean> {
    try {
      // Get current user bot
      const userBot = await this.getUserBot(userId);
      if (!userBot) return false;

      // Update interaction history
      const updatedHistory = [
        ...userBot.interaction_history,
        {
          ...interaction,
          timestamp: new Date().toISOString()
        }
      ];

      const { error } = await supabase
        .from('user_bots')
        .update({ 
          interaction_history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // If learning is enabled, create/update learning patterns
      if (userBot.learning_enabled) {
        await this.updateLearningPatterns(userBot.bot_id, interaction);
      }

      return true;
    } catch (error) {
      console.error('Error recording bot interaction:', error);
      return false;
    }
  }

  /**
   * Update learning patterns based on interaction
   */
  private static async updateLearningPatterns(
    botId: string, 
    interaction: any
  ): Promise<void> {
    try {
      // Create or update content preference pattern
      const contentPattern = {
        pattern_type: 'content_preference',
        pattern_data: {
          target_type: interaction.target_type,
          success_score: interaction.success_score,
          context: interaction.context
        }
      };

      await supabase
        .from('bot_learning_patterns')
        .upsert({
          bot_id: botId,
          ...contentPattern,
          success_score: interaction.success_score,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'bot_id,pattern_type'
        });

      // Create or update interaction style pattern
      const stylePattern = {
        pattern_type: 'interaction_style',
        pattern_data: {
          interaction_type: interaction.type,
          success_score: interaction.success_score,
          context: interaction.context
        }
      };

      await supabase
        .from('bot_learning_patterns')
        .upsert({
          bot_id: botId,
          ...stylePattern,
          success_score: interaction.success_score,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'bot_id,pattern_type'
        });

    } catch (error) {
      console.error('Error updating learning patterns:', error);
    }
  }

  /**
   * Get bot learning insights
   */
  static async getBotLearningInsights(userId: string): Promise<any> {
    try {
      const userBot = await this.getUserBot(userId);
      if (!userBot) return null;

      const { data: patterns, error } = await supabase
        .from('bot_learning_patterns')
        .select('*')
        .eq('bot_id', userBot.bot_id)
        .order('success_score', { ascending: false });

      if (error) throw error;

      // Analyze patterns
      const insights = {
        totalPatterns: patterns?.length || 0,
        averageSuccess: patterns?.reduce((sum, p) => sum + p.success_score, 0) / (patterns?.length || 1),
        topPatterns: patterns?.slice(0, 3) || [],
        learningProgress: this.calculateLearningProgress(patterns || []),
        recommendations: this.generateRecommendations(patterns || [])
      };

      return insights;
    } catch (error) {
      console.error('Error getting bot learning insights:', error);
      return null;
    }
  }

  /**
   * Calculate learning progress
   */
  private static calculateLearningProgress(patterns: any[]): any {
    if (patterns.length === 0) return { level: 'beginner', progress: 0 };

    const avgSuccess = patterns.reduce((sum, p) => sum + p.success_score, 0) / patterns.length;
    const totalUsage = patterns.reduce((sum, p) => sum + p.usage_count, 0);

    let level = 'beginner';
    let progress = 0;

    if (totalUsage >= 50 && avgSuccess >= 0.8) {
      level = 'expert';
      progress = 100;
    } else if (totalUsage >= 25 && avgSuccess >= 0.6) {
      level = 'intermediate';
      progress = 75;
    } else if (totalUsage >= 10 && avgSuccess >= 0.4) {
      level = 'beginner';
      progress = 50;
    } else {
      level = 'new';
      progress = 25;
    }

    return { level, progress };
  }

  /**
   * Generate learning recommendations
   */
  private static generateRecommendations(patterns: any[]): string[] {
    const recommendations: string[] = [];

    if (patterns.length === 0) {
      recommendations.push('Start interacting with cherries to build your bot&apos;s personality');
      return recommendations;
    }

    const lowSuccessPatterns = patterns.filter(p => p.success_score < 0.5);
    if (lowSuccessPatterns.length > 0) {
      recommendations.push('Focus on improving interaction quality in areas with low success scores');
    }

    const recentPatterns = patterns.filter(p => {
      const lastUsed = new Date(p.last_used);
      const daysAgo = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    if (recentPatterns.length < 5) {
      recommendations.push('Increase daily interactions to improve learning speed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your bot is learning well! Keep up the good interactions');
    }

    return recommendations;
  }

  /**
   * Get bot performance metrics
   */
  static async getBotPerformanceMetrics(userId: string): Promise<any> {
    try {
      const userBot = await this.getUserBot(userId);
      if (!userBot) return null;

      // Get bot interactions
      const { data: interactions, error } = await supabase
        .from('bot_interactions')
        .select('*')
        .eq('bot_id', userBot.bot_id);

      if (error) throw error;

      const metrics = {
        totalInteractions: interactions?.length || 0,
        interactionTypes: this.countInteractionTypes(interactions || []),
        averageEngagement: this.calculateAverageEngagement(interactions || []),
        recentActivity: this.getRecentActivity(interactions || [])
      };

      return metrics;
    } catch (error) {
      console.error('Error getting bot performance metrics:', error);
      return null;
    }
  }

  /**
   * Count interaction types
   */
  private static countInteractionTypes(interactions: any[]): Record<string, number> {
    return interactions.reduce((acc, interaction) => {
      acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate average engagement
   */
  private static calculateAverageEngagement(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    
    // This would be based on actual engagement metrics
    // For now, return a simple count-based score
    return interactions.length / 10; // Normalize to 0-1 scale
  }

  /**
   * Get recent activity
   */
  private static getRecentActivity(interactions: any[]): any[] {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return interactions
      .filter(interaction => new Date(interaction.created_at) >= oneWeekAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }
}
