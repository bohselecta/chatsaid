import { supabase } from './supabaseClient';

export interface BotProfile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  is_bot: boolean;
  bot_type?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const botProfileService = {
  /**
   * Get all bot profiles
   */
  async getBotProfiles(): Promise<BotProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_bot', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bot profiles:', error);
      return [];
    }
  },

  /**
   * Get active bot profiles
   */
  async getActiveBotProfiles(): Promise<BotProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_bot', true)
        .eq('active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active bot profiles:', error);
      return [];
    }
  },

  /**
   * Get bot profile by ID
   */
  async getBotProfile(id: string): Promise<BotProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('is_bot', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bot profile:', error);
      return null;
    }
  },

  /**
   * Create a new bot profile
   */
  async createBotProfile(profile: Partial<BotProfile>): Promise<BotProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profile,
          is_bot: true,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bot profile:', error);
      return null;
    }
  },

  /**
   * Update bot profile
   */
  async updateBotProfile(id: string, updates: Partial<BotProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_bot', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating bot profile:', error);
      return false;
    }
  },

  /**
   * Toggle bot active status
   */
  async toggleBotActive(id: string): Promise<boolean> {
    try {
      const profile = await this.getBotProfile(id);
      if (!profile) return false;

      const { error } = await supabase
        .from('profiles')
        .update({
          active: !profile.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling bot active status:', error);
      return false;
    }
  },

  /**
   * Delete bot profile
   */
  async deleteBotProfile(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('is_bot', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting bot profile:', error);
      return false;
    }
  },

  /**
   * Check if a profile is a bot
   */
  async isBotProfile(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_bot')
        .eq('id', id)
        .single();

      if (error) return false;
      return data?.is_bot || false;
    } catch (error) {
      console.error('Error checking if profile is bot:', error);
      return false;
    }
  },

  /**
   * Get bot statistics
   */
  async getBotStats(): Promise<Record<string, any>> {
    try {
      const bots = await this.getBotProfiles();
      const stats: Record<string, any> = {};

      for (const bot of bots) {
        // Get post count
        const { count: postCount } = await supabase
          .from('cherries')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', bot.id);

        // Get last post
        const { data: lastPost } = await supabase
          .from('cherries')
          .select('created_at')
          .eq('author_id', bot.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        stats[bot.id] = {
          display_name: bot.display_name,
          post_count: postCount || 0,
          last_post: lastPost?.created_at || null,
          active: bot.active,
          bot_type: bot.bot_type
        };
      }

      return stats;
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      return {};
    }
  },

  /**
   * Create a cherry post for a bot
   */
  async createBotCherry(botId: string, generatedPost: any): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('cherries')
        .insert({
          title: generatedPost.title || null,
          content: generatedPost.content,
          author_id: botId,
          privacy_level: 'public',
          tags: generatedPost.tags || [],
          source_file: generatedPost.source_file || 'AI Generated',
          line_number: generatedPost.line_number || 1,
          review_status: 'approved',
          is_featured: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating bot cherry:', error);
      return null;
    }
  }
};
