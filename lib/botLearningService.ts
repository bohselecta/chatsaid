import { supabase } from './supabaseClient';
import { BotPersonality } from './aiBotService';

export interface LearningPattern {
  id: string;
  bot_id: string;
  pattern_type: 'response_style' | 'topic_preference' | 'engagement_pattern' | 'user_feedback';
  pattern_data: any;
  success_score: number;
  usage_count: number;
  last_used: string;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  bot_id: string;
  cherry_id: string;
  feedback_type: 'positive' | 'negative' | 'neutral';
  feedback_score: number;
  user_comment?: string;
  context_data: any;
  created_at: string;
}

export interface BotLearningInsights {
  bot_id: string;
  total_patterns: number;
  average_success_score: number;
  top_performing_patterns: LearningPattern[];
  recent_improvements: string[];
  learning_recommendations: string[];
}

export class BotLearningService {
  // Track user feedback for bot responses
  static async trackUserFeedback(
    botId: string,
    cherryId: string,
    feedbackType: 'positive' | 'negative' | 'neutral',
    feedbackScore: number,
    userComment?: string,
    contextData?: any
  ): Promise<void> {
    try {
      await supabase
        .from('user_feedback')
        .insert({
          bot_id: botId,
          cherry_id: cherryId,
          feedback_type: feedbackType,
          feedback_score: feedbackScore,
          user_comment: userComment,
          context_data: contextData || {}
        });
    } catch (error) {
      console.error('Error tracking user feedback:', error);
      // Don't throw - feedback tracking shouldn't break main functionality
    }
  }

  // Learn from successful interactions
  static async learnFromSuccess(
    botId: string,
    patternType: string,
    patternData: any,
    successScore: number = 1.0
  ): Promise<void> {
    try {
      // Check if pattern already exists
      const { data: existing } = await supabase
        .from('bot_conversation_patterns')
        .select('*')
        .eq('bot_id', botId)
        .eq('pattern_type', patternType)
        .eq('pattern_data', JSON.stringify(patternData))
        .single();

      if (existing) {
        // Update existing pattern
        const newSuccessScore = (existing.success_score * existing.usage_count + successScore) / (existing.usage_count + 1);
        await supabase
          .from('bot_conversation_patterns')
          .update({
            success_score: newSuccessScore,
            usage_count: existing.usage_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new pattern
        await supabase
          .from('bot_conversation_patterns')
          .insert({
            bot_id: botId,
            pattern_type: patternType,
            pattern_data: patternData,
            success_score: successScore,
            usage_count: 1,
            last_used: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error learning from success:', error);
    }
  }

  // Learn from failed interactions
  static async learnFromFailure(
    botId: string,
    patternType: string,
    patternData: any,
    failureReason?: string
  ): Promise<void> {
    try {
      // Check if pattern exists
      const { data: existing } = await supabase
        .from('bot_conversation_patterns')
        .select('*')
        .eq('bot_id', botId)
        .eq('pattern_type', patternType)
        .eq('pattern_data', JSON.stringify(patternData))
        .single();

      if (existing) {
        // Reduce success score for failed patterns
        const newSuccessScore = Math.max(0, existing.success_score - 0.2);
        await supabase
          .from('bot_conversation_patterns')
          .update({
            success_score: newSuccessScore,
            usage_count: existing.usage_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', existing.id);
      }
    } catch (error) {
      console.error('Error learning from failure:', error);
    }
  }

  // Get learned patterns for a bot
  static async getLearnedPatterns(
    botId: string,
    patternType?: string,
    limit: number = 10
  ): Promise<LearningPattern[]> {
    try {
      let query = supabase
        .from('bot_conversation_patterns')
        .select('*')
        .eq('bot_id', botId)
        .order('success_score', { ascending: false })
        .limit(limit);

      if (patternType) {
        query = query.eq('pattern_type', patternType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting learned patterns:', error);
      return [];
    }
  }

  // Get top performing patterns for a bot
  static async getTopPerformingPatterns(
    botId: string,
    limit: number = 5
  ): Promise<LearningPattern[]> {
    try {
      const { data, error } = await supabase
        .from('bot_conversation_patterns')
        .select('*')
        .eq('bot_id', botId)
        .gte('success_score', 0.7)
        .order('success_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting top performing patterns:', error);
      return [];
    }
  }

  // Analyze bot learning progress
  static async getBotLearningInsights(botId: string): Promise<BotLearningInsights> {
    try {
      const [patterns, feedback] = await Promise.all([
        this.getLearnedPatterns(botId),
        this.getUserFeedback(botId)
      ]);

      const totalPatterns = patterns.length;
      const averageSuccessScore = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + p.success_score, 0) / patterns.length 
        : 0;

      const topPerformingPatterns = patterns
        .filter(p => p.success_score >= 0.8)
        .slice(0, 3);

      const recentImprovements = this.analyzeRecentImprovements(patterns);
      const learningRecommendations = this.generateLearningRecommendations(patterns, feedback);

      return {
        bot_id: botId,
        total_patterns: totalPatterns,
        average_success_score: averageSuccessScore,
        top_performing_patterns: topPerformingPatterns,
        recent_improvements: recentImprovements,
        learning_recommendations: learningRecommendations
      };
    } catch (error) {
      console.error('Error getting bot learning insights:', error);
      return {
        bot_id: botId,
        total_patterns: 0,
        average_success_score: 0,
        top_performing_patterns: [],
        recent_improvements: [],
        learning_recommendations: []
      };
    }
  }

  // Get user feedback for a bot
  static async getUserFeedback(botId: string, limit: number = 50): Promise<UserFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return [];
    }
  }

  // Analyze recent improvements in bot performance
  private static analyzeRecentImprovements(patterns: LearningPattern[]): string[] {
    const improvements: string[] = [];
    
    // Find patterns that have improved recently
    const recentPatterns = patterns
      .filter(p => {
        const lastUsed = new Date(p.last_used);
        const daysAgo = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7; // Last 7 days
      })
      .sort((a, b) => b.success_score - a.success_score);

    if (recentPatterns.length > 0) {
      const topPattern = recentPatterns[0];
      improvements.push(`Improved ${topPattern.pattern_type} pattern with ${(topPattern.success_score * 100).toFixed(1)}% success rate`);
    }

    // Find patterns with increasing usage
    const highUsagePatterns = patterns
      .filter(p => p.usage_count >= 5)
      .sort((a, b) => b.usage_count - a.usage_count);

    if (highUsagePatterns.length > 0) {
      const popularPattern = highUsagePatterns[0];
      improvements.push(`Popular ${popularPattern.pattern_type} pattern used ${popularPattern.usage_count} times`);
    }

    return improvements;
  }

  // Generate learning recommendations for bot improvement
  private static generateLearningRecommendations(
    patterns: LearningPattern[],
    feedback: UserFeedback[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze success score distribution
    const lowSuccessPatterns = patterns.filter(p => p.success_score < 0.5);
    if (lowSuccessPatterns.length > 0) {
      recommendations.push(`Focus on improving ${lowSuccessPatterns.length} low-performing patterns`);
    }

    // Analyze feedback sentiment
    const negativeFeedback = feedback.filter(f => f.feedback_type === 'negative');
    if (negativeFeedback.length > 0) {
      recommendations.push(`Address ${negativeFeedback.length} negative feedback instances`);
    }

    // Suggest pattern diversification
    const patternTypes = new Set(patterns.map(p => p.pattern_type));
    if (patternTypes.size < 3) {
      recommendations.push('Diversify conversation patterns for better engagement');
    }

    // Suggest based on usage patterns
    const underusedPatterns = patterns.filter(p => p.usage_count < 3);
    if (underusedPatterns.length > 0) {
      recommendations.push(`Experiment with ${underusedPatterns.length} underutilized patterns`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Bot is learning well! Consider exploring new conversation areas');
    }

    return recommendations;
  }

  // Adapt bot personality based on learning
  static async adaptBotPersonality(
    botId: string,
    adaptationType: 'conversation_style' | 'expertise_areas' | 'response_length'
  ): Promise<Partial<BotPersonality> | null> {
    try {
      const patterns = await this.getLearnedPatterns(botId, adaptationType);
      const feedback = await this.getUserFeedback(botId);

      if (patterns.length === 0) return null;

      // Find the most successful pattern
      const bestPattern = patterns.reduce((best, current) => 
        current.success_score > best.success_score ? current : best
      );

      // Generate adaptation based on pattern type
      switch (adaptationType) {
        case 'conversation_style':
          return this.adaptConversationStyle(bestPattern, feedback);
        case 'expertise_areas':
          return this.adaptExpertiseAreas(bestPattern, feedback);
        case 'response_length':
          return this.adaptResponseLength(bestPattern, feedback);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error adapting bot personality:', error);
      return null;
    }
  }

  // Adapt conversation style based on learning
  private static adaptConversationStyle(
    pattern: LearningPattern,
    feedback: UserFeedback[]
  ): Partial<BotPersonality> | null {
    // Analyze which conversation styles get positive feedback
    const positiveFeedback = feedback.filter(f => f.feedback_type === 'positive');
    
    if (positiveFeedback.length === 0) return null;

    // This would integrate with your bot personality system
    // For now, return a suggestion
    return {
      conversation_style: 'friendly' // Default adaptation
    };
  }

  // Adapt expertise areas based on learning
  private static adaptExpertiseAreas(
    pattern: LearningPattern,
    feedback: UserFeedback[]
  ): Partial<BotPersonality> | null {
    // Analyze which topics get positive engagement
    const positiveFeedback = feedback.filter(f => f.feedback_type === 'positive');
    
    if (positiveFeedback.length === 0) return null;

    // Extract common topics from positive feedback
    const topics = positiveFeedback
      .map(f => f.context_data?.topics || [])
      .flat()
      .filter(Boolean);

    if (topics.length === 0) return null;

    // Return most common positive topics
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([topic]) => topic);

    return {
      expertise_areas: topTopics
    };
  }

  // Adapt response length based on learning
  private static adaptResponseLength(
    pattern: LearningPattern,
    feedback: UserFeedback[]
  ): Partial<BotPersonality> | null {
    // Analyze which response lengths get positive feedback
    const positiveFeedback = feedback.filter(f => f.feedback_type === 'positive');
    
    if (positiveFeedback.length === 0) return null;

    // This would analyze the actual response lengths that work well
    // For now, return a default adaptation
    return {
      response_length: 'medium'
    };
  }

  // Get learning progress summary
  static async getLearningProgressSummary(botId: string): Promise<{
    totalPatterns: number;
    averageSuccess: number;
    improvementRate: number;
    learningStatus: 'beginner' | 'intermediate' | 'advanced';
  }> {
    try {
      const patterns = await this.getLearnedPatterns(botId);
      const feedback = await this.getUserFeedback(botId);

      const totalPatterns = patterns.length;
      const averageSuccess = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + p.success_score, 0) / patterns.length 
        : 0;

      // Calculate improvement rate (simplified)
      const recentPatterns = patterns.filter(p => {
        const lastUsed = new Date(p.last_used);
        const daysAgo = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });

      const improvementRate = recentPatterns.length > 0 
        ? recentPatterns.reduce((sum, p) => sum + p.success_score, 0) / recentPatterns.length - averageSuccess
        : 0;

      // Determine learning status
      let learningStatus: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (totalPatterns >= 20 && averageSuccess >= 0.8) {
        learningStatus = 'advanced';
      } else if (totalPatterns >= 10 && averageSuccess >= 0.6) {
        learningStatus = 'intermediate';
      }

      return {
        totalPatterns,
        averageSuccess,
        improvementRate,
        learningStatus
      };
    } catch (error) {
      console.error('Error getting learning progress summary:', error);
      return {
        totalPatterns: 0,
        averageSuccess: 0,
        improvementRate: 0,
        learningStatus: 'beginner'
      };
    }
  }
}
