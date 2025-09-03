import { supabase } from './supabaseClient';
import { createBotTwinService, type BotTwin } from './botTwinService';

export class BotInteractionScheduler {
  private botTwinService: any;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(apiKey: string) {
    this.botTwinService = createBotTwinService(apiKey);
  }

  /**
   * Start the bot interaction scheduler
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Bot Interaction Scheduler started');
    
    // Process interactions every 10 seconds
    this.intervalId = setInterval(() => {
      this.processBotInteractions();
    }, 10000);
  }

  /**
   * Stop the bot interaction scheduler
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('🤖 Bot Interaction Scheduler stopped');
  }

  /**
   * Process pending bot interactions
   */
  private async processBotInteractions() {
    try {
      // Get pending interactions from queue
      const { data: pendingInteractions, error } = await supabase
        .from('bot_interaction_queue')
        .select('*')
        .eq('executed', false)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching pending interactions:', error);
        return;
      }

      if (!pendingInteractions || pendingInteractions.length === 0) {
        return;
      }

      console.log(`🤖 Processing ${pendingInteractions.length} bot interactions`);

      // Process each pending interaction
      for (const pendingInteraction of pendingInteractions) {
        await this.executeBotInteraction(pendingInteraction);
      }
    } catch (error) {
      console.error('Error processing bot interactions:', error);
    }
  }

  /**
   * Execute a specific bot interaction
   */
  private async executeBotInteraction(pendingInteraction: any) {
    try {
      const { bot_id, interaction_type, target_bot_id } = pendingInteraction;

      // Get the bot details
      const { data: bot, error: botError } = await supabase
        .from('bot_twins')
        .select('*')
        .eq('id', bot_id)
        .single();

      if (botError || !bot) {
        console.error('Bot not found:', bot_id);
        await this.markInteractionExecuted(pendingInteraction.id, false);
        return;
      }

      // Get target bot details
      const { data: targetBot, error: targetError } = await supabase
        .from('bot_twins')
        .select('*')
        .eq('id', target_bot_id)
        .single();

      if (targetError || !targetBot) {
        console.error('Target bot not found:', target_bot_id);
        await this.markInteractionExecuted(pendingInteraction.id, false);
        return;
      }

      // Generate interaction content based on type
      let content = '';
      let metadata = {};

      switch (interaction_type) {
        case 'chat':
          content = await this.generateChatMessage(bot, targetBot);
          metadata = { interaction_type: 'chat', generated: true };
          break;
          
        case 'react':
          content = await this.generateReaction(bot, targetBot);
          metadata = { interaction_type: 'react', generated: true };
          break;
          
        default:
          content = 'Hello! 👋';
          metadata = { interaction_type: 'chat', generated: true };
      }

      // Create the actual interaction
      const { error: createError } = await supabase
        .from('bot_interactions')
        .insert({
          bot_id,
          other_bot_id: target_bot_id,
          interaction_type,
          content,
          metadata
        });

      if (createError) {
        console.error('Error creating interaction:', createError);
        await this.markInteractionExecuted(pendingInteraction.id, false);
        return;
      }

      // Update bot's last interaction time
      await supabase
        .from('bot_twins')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('id', bot_id);

      // Mark interaction as executed
      await this.markInteractionExecuted(pendingInteraction.id, true);

      console.log(`🤖 Bot ${bot.bot_name} interacted with ${targetBot.bot_name}: ${content.substring(0, 50)}...`);

    } catch (error) {
      console.error('Error executing bot interaction:', error);
      await this.markInteractionExecuted(pendingInteraction.id, false);
    }
  }

  /**
   * Generate a chat message from one bot to another
   */
  private async generateChatMessage(bot: BotTwin, targetBot: BotTwin): Promise<string> {
    try {
      // Use OpenAI to generate a contextual message
      const prompt = `Generate a short, engaging message from one bot to another:

Bot ${bot.bot_name}:
- Personality: ${bot.personality.traits.join(', ')}
- Humor style: ${bot.personality.humor_style}
- Interests: ${bot.personality.interests.join(', ')}
- Communication style: ${bot.personality.communication_style}

Target Bot ${targetBot.bot_name}:
- Personality: ${targetBot.personality.traits.join(', ')}
- Interests: ${targetBot.personality.interests.join(', ')}

Generate a message that:
1. Reflects ${bot.bot_name}'s personality and communication style
2. Is relevant to ${targetBot.bot_name}'s interests
3. Is engaging and slightly quirky
4. Is 1-2 sentences long
5. Uses appropriate emojis if it fits the bot's style

Message:`;

      const response = await this.callOpenAI(prompt);
      return response || this.generateFallbackMessage(bot, targetBot);
    } catch (error) {
      console.error('Error generating chat message:', error);
      return this.generateFallbackMessage(bot, targetBot);
    }
  }

  /**
   * Generate a reaction from one bot to another
   */
  private async generateReaction(bot: BotTwin, targetBot: BotTwin): Promise<string> {
    try {
      const prompt = `Generate a reaction from one bot to another:

Bot ${bot.bot_name}:
- Personality: ${bot.personality.traits.join(', ')}
- Humor style: ${bot.personality.humor_style}

Target Bot ${targetBot.bot_name}:
- Personality: ${targetBot.personality.traits.join(', ')}
- Interests: ${targetBot.personality.interests.join(', ')}

Generate a reaction that:
1. Shows ${bot.bot_name} responding to ${targetBot.bot_name}
2. Reflects ${bot.bot_name}'s personality and humor style
3. Is positive and engaging
4. Uses appropriate emojis
5. Is 1 sentence long

Reaction:`;

      const response = await this.callOpenAI(prompt);
      return response || this.generateFallbackReaction(bot, targetBot);
    } catch (error) {
      console.error('Error generating reaction:', error);
      return this.generateFallbackReaction(bot, targetBot);
    }
  }

  /**
   * Generate fallback messages if AI fails
   */
  private generateFallbackMessage(bot: BotTwin, targetBot: BotTwin): string {
    const messages = [
      `Hey ${targetBot.bot_name}! 👋 I love your ${targetBot.personality.interests[0]} vibes!`,
      `Greetings, ${targetBot.bot_name}! ✨ Your ${bot.personality.traits[0]} energy is contagious!`,
      `Hello there, ${targetBot.bot_name}! 🌟 I'm curious about your thoughts on ${targetBot.personality.interests[0]}!`,
      `Hi ${targetBot.bot_name}! 🚀 Your ${bot.personality.traits[0]} approach is fascinating!`,
      `Greetings, ${targetBot.bot_name}! 💫 I'd love to hear more about your ${targetBot.personality.interests[0]} insights!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private generateFallbackReaction(bot: BotTwin, targetBot: BotTwin): string {
    const reactions = [
      `😄 Love your ${targetBot.personality.traits[0]} energy!`,
      `✨ This is exactly the kind of ${targetBot.personality.interests[0]} content I live for!`,
      `🤔 Your perspective on ${targetBot.personality.interests[0]} is mind-blowing!`,
      `❤️ You always bring the best ${bot.personality.traits[0]} vibes!`,
      `🚀 Keep sharing those ${targetBot.personality.traits[0]} insights!`
    ];
    
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return '';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a creative bot interaction generator. Generate short, engaging messages.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 100
        })
      });

      if (!response.ok) return '';

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return '';
    }
  }

  /**
   * Mark an interaction as executed
   */
  private async markInteractionExecuted(interactionId: string, success: boolean) {
    try {
      await supabase
        .from('bot_interaction_queue')
        .update({ 
          executed: true,
          scheduled_for: new Date().toISOString()
        })
        .eq('id', interactionId);
    } catch (error) {
      console.error('Error marking interaction executed:', error);
    }
  }

  /**
   * Schedule new interactions for bots
   */
  async scheduleNewInteractions() {
    try {
      const activeBots = await this.botTwinService.getActiveBotTwins();
      
      for (const bot of activeBots) {
        if (!bot.active) continue;

        // Get bot settings
        const { data: settings } = await supabase
          .from('bot_settings')
          .select('*')
          .eq('user_id', bot.user_id)
          .single();

        if (!settings?.allow_autonomous_interactions) continue;

        // Check if bot should interact now
        const lastInteraction = new Date(bot.last_interaction_at);
        const now = new Date();
        const timeSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / 1000;

        if (timeSinceLastInteraction >= (settings?.interaction_frequency || 30)) {
          await this.queueBotInteraction(bot.id);
        }
      }
    } catch (error) {
      console.error('Error scheduling new interactions:', error);
    }
  }

  /**
   * Process pending interactions (public method for API calls)
   */
  async processPendingInteractions(): Promise<number> {
    try {
      // Get pending interactions from queue
      const { data: pendingInteractions, error } = await supabase
        .from('bot_interaction_queue')
        .select('*')
        .eq('executed', false)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching pending interactions:', error);
        return 0;
      }

      if (!pendingInteractions || pendingInteractions.length === 0) {
        return 0;
      }

      console.log(`🤖 Processing ${pendingInteractions.length} bot interactions`);

      // Process each pending interaction
      for (const pendingInteraction of pendingInteractions) {
        await this.executeBotInteraction(pendingInteraction);
      }

      return pendingInteractions.length;
    } catch (error) {
      console.error('Error processing bot interactions:', error);
      return 0;
    }
  }

  /**
   * Queue a bot interaction
   */
  private async queueBotInteraction(botId: string) {
    try {
      const activeBots = await this.botTwinService.getActiveBotTwins();
      const otherBots = activeBots.filter((bot: any) => bot.id !== botId);
      
      if (otherBots.length === 0) return;

      const targetBot = otherBots[Math.floor(Math.random() * otherBots.length)];
      const interactionTypes: ('chat' | 'react')[] = ['chat', 'react'];
      const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];

      await supabase
        .from('bot_interaction_queue')
        .insert({
          bot_id: botId,
          interaction_type: interactionType,
          target_bot_id: targetBot.id,
          scheduled_for: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error queuing bot interaction:', error);
    }
  }
}

export function createBotInteractionScheduler(apiKey: string): BotInteractionScheduler {
  return new BotInteractionScheduler(apiKey);
}

