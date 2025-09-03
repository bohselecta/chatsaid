import { supabase } from './supabaseClient';
import { ReactionType } from '@/components/ReactionButton';

export interface UserReaction {
  id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface EnhancedComment {
  id: string;
  content: string;
  author_id: string;
  author_display_name: string;
  author_avatar?: string;
  is_bot_comment: boolean;
  bot_personality?: string;
  created_at: string;
  parent_id?: string;
}

export interface CherryEngagement {
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  engagement_score: number;
}

export class SocialService {
  // Get user's reactions for a specific cherry
  static async getUserReactions(cherryId: string, userId: string): Promise<ReactionType[]> {
    try {
      const { data, error } = await supabase
        .from('user_reactions')
        .select('reaction_type')
        .eq('cherry_id', cherryId)
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(r => r.reaction_type as ReactionType) || [];
    } catch (error) {
      console.error('Error getting user reactions:', error);
      return [];
    }
  }

  // Get all reactions for a cherry
  static async getCherryReactions(cherryId: string): Promise<Record<ReactionType, number>> {
    try {
      const { data, error } = await supabase
        .from('user_reactions')
        .select('reaction_type')
        .eq('cherry_id', cherryId);

      if (error) throw error;

      const reactions: Record<ReactionType, number> = {
        heart: 0,
        laugh: 0,
        zap: 0,
        star: 0
      };

      data?.forEach(reaction => {
        reactions[reaction.reaction_type as ReactionType]++;
      });

      return reactions;
    } catch (error) {
      console.error('Error getting cherry reactions:', error);
      return { heart: 0, laugh: 0, zap: 0, star: 0 };
    }
  }

  // Add or remove a reaction
  static async toggleReaction(
    cherryId: string, 
    userId: string, 
    reactionType: ReactionType
  ): Promise<boolean> {
    try {
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('user_reactions')
        .select('id')
        .eq('cherry_id', cherryId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .single();

      if (existing) {
        // Remove existing reaction
        const { error } = await supabase
          .from('user_reactions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return false; // Reaction removed
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('user_reactions')
          .insert({
            cherry_id: cherryId,
            user_id: userId,
            reaction_type: reactionType
          });

        if (error) throw error;
        return true; // Reaction added
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  }

  // Get comments for a cherry
  static async getComments(cherryId: string): Promise<EnhancedComment[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_comments')
        .select(`
          id,
          content,
          author_id,
          parent_id,
          is_bot_comment,
          bot_personality,
          created_at,
          profiles!inner(
            display_name,
            avatar_url
          )
        `)
        .eq('cherry_id', cherryId)
        .is('parent_id', null) // Only top-level comments for now
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        author_id: comment.author_id,
        author_display_name: comment.profiles?.[0]?.display_name || 'Anonymous',
        author_avatar: comment.profiles?.[0]?.avatar_url,
        is_bot_comment: comment.is_bot_comment,
        bot_personality: comment.bot_personality,
        created_at: comment.created_at,
        parent_id: comment.parent_id
      }));
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Add a comment
  static async addComment(
    cherryId: string,
    userId: string,
    content: string,
    parentId?: string,
    isBotComment?: boolean,
    botPersonality?: string
  ): Promise<EnhancedComment | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_comments')
        .insert({
          cherry_id: cherryId,
          author_id: userId,
          content: content.trim(),
          parent_id: parentId || null,
          is_bot_comment: isBotComment || false,
          bot_personality: botPersonality || null
        })
        .select()
        .single();

      if (error) throw error;

      // For bot comments, we need to handle them differently since they don't have profiles
      if (isBotComment) {
        return {
          id: data.id,
          content: data.content,
          author_id: data.author_id,
          author_display_name: botPersonality || 'AI Bot',
          author_avatar: undefined,
          is_bot_comment: true,
          bot_personality: botPersonality,
          created_at: data.created_at,
          parent_id: data.parent_id
        };
      }

      // Get the full comment with profile info for human users
      const { data: fullComment, error: profileError } = await supabase
        .from('enhanced_comments')
        .select(`
          id,
          content,
          author_id,
          parent_id,
          is_bot_comment,
          bot_personality,
          created_at,
          profiles!inner(
            display_name,
            avatar_url
          )
        `)
        .eq('id', data.id)
        .single();

      if (profileError) throw profileError;

      return {
        id: fullComment.id,
        content: fullComment.content,
        author_id: fullComment.author_id,
        author_display_name: fullComment.profiles?.[0]?.display_name || 'Anonymous',
        author_avatar: fullComment.profiles?.[0]?.avatar_url,
        is_bot_comment: fullComment.is_bot_comment,
        bot_personality: fullComment.bot_personality,
        created_at: fullComment.created_at,
        parent_id: fullComment.parent_id
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get engagement metrics for a cherry
  static async getCherryEngagement(cherryId: string): Promise<CherryEngagement> {
    try {
      const { data, error } = await supabase
        .from('cherry_engagement')
        .select('*')
        .eq('cherry_id', cherryId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      if (!data) {
        // Return default engagement if none exists
        return {
          total_reactions: 0,
          total_comments: 0,
          total_shares: 0,
          engagement_score: 0.0
        };
      }

      return {
        total_reactions: data.total_reactions || 0,
        total_comments: data.total_comments || 0,
        total_shares: data.total_shares || 0,
        engagement_score: data.engagement_score || 0.0
      };
    } catch (error) {
      console.error('Error getting cherry engagement:', error);
      return {
        total_reactions: 0,
        total_comments: 0,
        total_shares: 0,
        engagement_score: 0.0
      };
    }
  }

  // Track user activity for recommendations
  static async trackActivity(
    userId: string,
    activityType: 'view' | 'react' | 'comment' | 'share',
    cherryId?: string,
    branchId?: string,
    activityData?: any
  ): Promise<void> {
    try {
      await supabase
        .from('user_activity_cache')
        .insert({
          user_id: userId,
          activity_type: activityType,
          cherry_id: cherryId,
          branch_id: branchId,
          activity_data: activityData
        });
    } catch (error) {
      console.error('Error tracking activity:', error);
      // Don't throw - activity tracking shouldn't break main functionality
    }
  }

  // Get cherries with engagement data
  static async getCherriesWithEngagement(cherryIds: string[]): Promise<Record<string, CherryEngagement>> {
    try {
      const { data, error } = await supabase
        .from('cherry_engagement')
        .select('*')
        .in('cherry_id', cherryIds);

      if (error) throw error;

      const engagementMap: Record<string, CherryEngagement> = {};
      
      (data || []).forEach(engagement => {
        engagementMap[engagement.cherry_id] = {
          total_reactions: engagement.total_reactions || 0,
          total_comments: engagement.total_comments || 0,
          total_shares: engagement.total_shares || 0,
          engagement_score: engagement.engagement_score || 0.0
        };
      });

      // Fill in missing cherries with default engagement
      cherryIds.forEach(id => {
        if (!engagementMap[id]) {
          engagementMap[id] = {
            total_reactions: 0,
            total_comments: 0,
            total_shares: 0,
            engagement_score: 0.0
          };
        }
      });

      return engagementMap;
    } catch (error) {
      console.error('Error getting cherries with engagement:', error);
      
      // Return default engagement for all cherries on error
      const defaultEngagement: CherryEngagement = {
        total_reactions: 0,
        total_comments: 0,
        total_shares: 0,
        engagement_score: 0.0
      };

      const engagementMap: Record<string, CherryEngagement> = {};
      cherryIds.forEach(id => {
        engagementMap[id] = defaultEngagement;
      });

      return engagementMap;
    }
  }
}
