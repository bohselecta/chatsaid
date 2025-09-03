import { supabase } from './supabaseClient';
import { BotPersonality } from './aiBotService';

export interface BotPerformanceMetrics {
  bot_id: string;
  metric_date: string;
  total_interactions: number;
  positive_reactions: number;
  user_engagement_score: number;
  conversation_continuation_rate: number;
}

export interface BotInteractionSummary {
  bot_id: string;
  bot_name: string;
  total_interactions: number;
  total_comments: number;
  total_reactions: number;
  average_confidence: number;
  favorite_topics: string[];
  conversation_style: string;
}

export interface BotTrendData {
  date: string;
  interactions: number;
  engagement_score: number;
  comments: number;
}

export class BotAnalyticsService {
  // Get performance metrics for a specific bot
  static async getBotPerformanceMetrics(
    botId: string,
    days: number = 30
  ): Promise<BotPerformanceMetrics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('bot_performance_metrics')
        .select('*')
        .eq('bot_id', botId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bot performance metrics:', error);
      return [];
    }
  }

  // Get summary statistics for all bots
  static async getBotInteractionSummary(): Promise<BotInteractionSummary[]> {
    try {
      const { data, error } = await supabase
        .from('bot_interactions')
        .select(`
          bot_id,
          interaction_type,
          confidence_score,
          bot_personalities!inner(
            name,
            conversation_style,
            expertise_areas
          )
        `);

      if (error) throw error;

      // Group by bot and calculate summary
      const botSummaries = new Map<string, BotInteractionSummary>();
      
      (data || []).forEach(interaction => {
        const botId = interaction.bot_id;
        const bot = interaction.bot_personalities?.[0];
        
        if (!botSummaries.has(botId)) {
          botSummaries.set(botId, {
            bot_id: botId,
            bot_name: bot?.name || 'Unknown Bot',
            total_interactions: 0,
            total_comments: 0,
            total_reactions: 0,
            average_confidence: 0,
            favorite_topics: bot?.expertise_areas || [],
            conversation_style: bot?.conversation_style || 'friendly'
          });
        }

        const summary = botSummaries.get(botId)!;
        summary.total_interactions++;
        
        if (interaction.interaction_type === 'comment') {
          summary.total_comments++;
        } else if (interaction.interaction_type === 'reaction') {
          summary.total_reactions++;
        }

        // Calculate running average confidence
        const currentTotal = summary.average_confidence * (summary.total_interactions - 1);
        summary.average_confidence = (currentTotal + interaction.confidence_score) / summary.total_interactions;
      });

      return Array.from(botSummaries.values());
    } catch (error) {
      console.error('Error getting bot interaction summary:', error);
      return [];
    }
  }

  // Get trend data for a bot over time
  static async getBotTrendData(
    botId: string,
    days: number = 30
  ): Promise<BotTrendData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('bot_interactions')
        .select('interaction_type, confidence_score, created_at')
        .eq('bot_id', botId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and calculate daily metrics
      const dailyMetrics = new Map<string, BotTrendData>();
      
      (data || []).forEach(interaction => {
        const date = new Date(interaction.created_at).toISOString().split('T')[0];
        
        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, {
            date,
            interactions: 0,
            engagement_score: 0,
            comments: 0
          });
        }

        const metrics = dailyMetrics.get(date)!;
        metrics.interactions++;
        
        if (interaction.interaction_type === 'comment') {
          metrics.comments++;
        }
        
        // Calculate engagement score (simplified)
        metrics.engagement_score = (metrics.comments / metrics.interactions) * 100;
      });

      // Fill in missing dates with zero values
      const result: BotTrendData[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        result.unshift({
          date: dateStr,
          interactions: dailyMetrics.get(dateStr)?.interactions || 0,
          engagement_score: dailyMetrics.get(dateStr)?.engagement_score || 0,
          comments: dailyMetrics.get(dateStr)?.comments || 0
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting bot trend data:', error);
      return [];
    }
  }

  // Get top performing bots
  static async getTopPerformingBots(limit: number = 5): Promise<BotInteractionSummary[]> {
    try {
      const summaries = await this.getBotInteractionSummary();
      
      // Sort by total interactions and engagement
      return summaries
        .sort((a, b) => {
          const aScore = a.total_interactions * a.average_confidence;
          const bScore = b.total_interactions * b.average_confidence;
          return bScore - aScore;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top performing bots:', error);
      return [];
    }
  }

  // Get bot engagement insights
  static async getBotEngagementInsights(botId: string): Promise<any> {
    try {
      const [performanceMetrics, trendData] = await Promise.all([
        this.getBotPerformanceMetrics(botId, 7), // Last 7 days
        this.getBotTrendData(botId, 7)
      ]);

      // Calculate insights
      const totalInteractions = trendData.reduce((sum, day) => sum + day.interactions, 0);
      const totalComments = trendData.reduce((sum, day) => sum + day.comments, 0);
      const averageEngagement = trendData.reduce((sum, day) => sum + day.engagement_score, 0) / trendData.length;

      // Identify trends
      const recentTrend = trendData.slice(-3); // Last 3 days
      const earlierTrend = trendData.slice(0, 3); // First 3 days
      
      const recentAvg = recentTrend.reduce((sum, day) => sum + day.interactions, 0) / recentTrend.length;
      const earlierAvg = earlierTrend.reduce((sum, day) => sum + day.interactions, 0) / earlierTrend.length;
      
      const trendDirection = recentAvg > earlierAvg ? 'increasing' : 'decreasing';
      const trendPercentage = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

      return {
        totalInteractions,
        totalComments,
        averageEngagement,
        trendDirection,
        trendPercentage: Math.abs(trendPercentage),
        dailyBreakdown: trendData,
        recommendations: this.generateRecommendations({
          totalInteractions,
          totalComments,
          averageEngagement,
          trendDirection,
          trendPercentage
        })
      };
    } catch (error) {
      console.error('Error getting bot engagement insights:', error);
      return {};
    }
  }

  // Generate recommendations based on performance
  private static generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.totalInteractions < 10) {
      recommendations.push('Increase bot visibility by adding more personality-driven responses');
    }

    if (metrics.averageEngagement < 50) {
      recommendations.push('Focus on generating more engaging and contextual responses');
    }

    if (metrics.trendDirection === 'decreasing' && metrics.trendPercentage > 20) {
      recommendations.push('Consider adjusting conversation style to better match user preferences');
    }

    if (metrics.totalComments < metrics.totalInteractions * 0.3) {
      recommendations.push('Encourage more comment-based interactions over simple reactions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Bot is performing well! Consider expanding to new conversation areas');
    }

    return recommendations;
  }

  // Track custom bot event
  static async trackBotEvent(
    botId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      await supabase
        .from('bot_interactions')
        .insert({
          bot_id: botId,
          interaction_type: eventType,
          content: JSON.stringify(eventData),
          confidence_score: 1.0
        });
    } catch (error) {
      console.error('Error tracking bot event:', error);
      // Don't throw - tracking shouldn't break main functionality
    }
  }

  // Get bot conversation quality score
  static async getBotQualityScore(botId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('bot_interactions')
        .select('confidence_score, interaction_type')
        .eq('bot_id', botId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error) throw error;

      if (!data || data.length === 0) return 0;

      // Calculate weighted quality score
      const weights = {
        comment: 0.6,
        reaction: 0.3,
        question: 0.8,
        insight: 0.9
      };

      let totalScore = 0;
      let totalWeight = 0;

      data.forEach(interaction => {
        const weight = weights[interaction.interaction_type as keyof typeof weights] || 0.5;
        totalScore += interaction.confidence_score * weight;
        totalWeight += weight;
      });

      return totalWeight > 0 ? totalScore / totalWeight : 0;
    } catch (error) {
      console.error('Error getting bot quality score:', error);
      return 0;
    }
  }
}
