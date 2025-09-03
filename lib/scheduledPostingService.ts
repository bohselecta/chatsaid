import { supabase } from './supabaseClient';

export interface ScheduledPostingService {
  startScheduledPosting(): Promise<void>;
  stopScheduledPosting(): Promise<void>;
  triggerManualPost(personaId: string, category: string): Promise<boolean>;
}

export function createScheduledPostingService(apiKey: string): ScheduledPostingService {
  return new ScheduledPostingServiceImpl(apiKey);
}

class ScheduledPostingServiceImpl implements ScheduledPostingService {
  private apiKey: string;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startScheduledPosting(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Scheduled posting started');
    
    // Process scheduled posts every 5 minutes
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 5 * 60 * 1000);
  }

  async stopScheduledPosting(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('🤖 Scheduled posting stopped');
  }

  async triggerManualPost(personaId: string, category: string): Promise<boolean> {
    try {
      // Get bot profile
      const { data: botProfile, error: botError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', personaId)
        .single();

      if (botError || !botProfile) {
        console.error('Bot profile not found:', personaId);
        return false;
      }

      // Generate post content using OpenAI
      const postContent = await this.generateBotPost(botProfile, category);
      
      if (!postContent) {
        return false;
      }

      // Create the cherry post
      const { error: postError } = await supabase
        .from('cherries')
        .insert({
          content: postContent,
          author_id: personaId,
          branch_type: category,
          privacy_level: 'public',
          is_bot_post: true,
          created_at: new Date().toISOString()
        });

      if (postError) {
        console.error('Error creating bot post:', postError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error triggering manual post:', error);
      return false;
    }
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      // Get bots that should post
      const { data: bots, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_bot', true)
        .eq('active', true);

      if (error || !bots) {
        console.error('Error fetching bots:', error);
        return;
      }

      // Process each bot
      for (const bot of bots) {
        await this.processBotPosting(bot);
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
    }
  }

  private async processBotPosting(bot: any): Promise<void> {
    try {
      // Check if bot should post now (based on last post time)
      const shouldPost = await this.shouldBotPost(bot);
      
      if (!shouldPost) {
        return;
      }

      // Select random category
      const categories = ['Funny', 'Mystical', 'Technical', 'Research', 'Ideas'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      // Generate and post content
      const success = await this.triggerManualPost(bot.id, randomCategory);
      
      if (success) {
        console.log(`🤖 Bot ${bot.display_name} posted in ${randomCategory} category`);
      }
    } catch (error) {
      console.error(`Error processing bot ${bot.id}:`, error);
    }
  }

  private async shouldBotPost(bot: any): Promise<boolean> {
    try {
      // Get bot's last post
      const { data: lastPost, error } = await supabase
        .from('cherries')
        .select('created_at')
        .eq('author_id', bot.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking last post:', error);
        return false;
      }

      if (!lastPost) {
        return true; // First post
      }

      // Check if enough time has passed (e.g., 24 hours)
      const lastPostTime = new Date(lastPost.created_at);
      const now = new Date();
      const hoursSinceLastPost = (now.getTime() - lastPostTime.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastPost >= 24;
    } catch (error) {
      console.error('Error checking if bot should post:', error);
      return false;
    }
  }

  private async generateBotPost(botProfile: any, category: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are ${botProfile.display_name}, a bot persona on ChatSaid. Generate a short, engaging post (max 200 characters) for the ${category} category. Keep it authentic to your personality.`
            },
            {
              role: 'user',
              content: `Create a ${category} category post.`
            }
          ],
          temperature: 0.8,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error('Error generating bot post:', error);
      return null;
    }
  }
}


