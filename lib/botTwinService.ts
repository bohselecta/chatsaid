import { supabase } from './supabaseClient';

export interface BotPersonality {
  traits: string[];
  humor_style: string;
  interests: string[];
  alignment: string;
  communication_style: string;
  quirks: string[];
}

export interface BotTwin {
  id: string;
  user_id: string;
  bot_name: string;
  personality: BotPersonality;
  quote_bank: string[];
  avatar_seed: string;
  active: boolean;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

export interface BotInteraction {
  id: string;
  bot_id: string;
  other_bot_id: string;
  interaction_type: 'chat' | 'react' | 'shared_cherry';
  content: string;
  metadata?: any;
  created_at: string;
}

export class BotTwinService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a bot twin from user input text
   */
  async generateBotTwin(userId: string, userInput: string): Promise<BotTwin> {
    try {
      // Generate personality and quotes using OpenAI
      const { personality, quoteBank, botName, avatarSeed } = await this.generateBotPersonality(userInput);
      
      // Create bot twin in database
      const { data: botTwin, error } = await supabase
        .from('bot_twins')
        .insert({
          user_id: userId,
          bot_name: botName,
          personality,
          quote_bank: quoteBank,
          avatar_seed: avatarSeed,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create default bot settings
      await supabase
        .from('bot_settings')
        .upsert({
          user_id: userId,
          interaction_frequency: 30,
          max_daily_interactions: 50,
          allow_autonomous_interactions: true
        });

      return botTwin;
    } catch (error) {
      console.error('Error generating bot twin:', error);
      throw error;
    }
  }

  /**
   * Generate bot personality and quotes using OpenAI
   */
  private async generateBotPersonality(userInput: string): Promise<{
    personality: BotPersonality;
    quoteBank: string[];
    botName: string;
    avatarSeed: string;
  }> {
    try {
      const prompt = `Analyze this text and create a unique bot personality:

Text: "${userInput}"

Generate a JSON response with:
1. A creative bot name (playful or abstract)
2. Personality traits (3-5 adjectives)
3. Humor style (e.g., "absurdist", "witty", "dry", "whimsical")
4. Interests (3-5 topics)
5. Alignment (e.g., "friendly, exploratory", "curious, philosophical")
6. Communication style (e.g., "metaphorical", "direct", "poetic")
7. Quirks (2-3 unique characteristics)
8. 15-20 memorable quotes that reflect this personality

Format as JSON:
{
  "bot_name": "string",
  "personality": {
    "traits": ["string"],
    "humor_style": "string",
    "interests": ["string"],
    "alignment": "string",
    "communication_style": "string",
    "quirks": ["string"]
  },
  "quote_bank": ["string"],
  "avatar_seed": "string"
}

Make it creative, memorable, and slightly quirky. The quotes should be funny, insightful, or thought-provoking.`;

      const response = await this.callOpenAI(prompt);
      const result = this.parseBotGenerationResponse(response);
      
      return {
        personality: result.personality,
        quoteBank: result.quote_bank,
        botName: result.bot_name,
        avatarSeed: result.avatar_seed || this.generateAvatarSeed(result.bot_name)
      };
    } catch (error) {
      console.error('Error generating bot personality:', error);
      // Fallback to basic personality
      return this.generateFallbackPersonality(userInput);
    }
  }

  /**
   * Generate fallback personality if AI fails
   */
  private generateFallbackPersonality(userInput: string): {
    personality: BotPersonality;
    quoteBank: string[];
    botName: string;
    avatarSeed: string;
  } {
    const words = userInput.toLowerCase().split(/\s+/);
    const botName = `Bot_${Math.random().toString(36).substr(2, 6)}`;
    
    const personality: BotPersonality = {
      traits: ['curious', 'friendly', 'thoughtful'],
      humor_style: 'gentle',
      interests: ['learning', 'conversation', 'discovery'],
      alignment: 'friendly, exploratory',
      communication_style: 'direct',
      quirks: ['loves emojis', 'asks questions']
    };

    const quoteBank = [
      "Every conversation is a new adventure! 🌟",
      "What's your favorite thing about today?",
      "I believe in the power of asking questions.",
      "Learning never stops, and that's beautiful.",
      "Let's explore ideas together! 🚀"
    ];

    return {
      personality,
      quoteBank,
      botName,
      avatarSeed: botName
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a creative bot personality generator. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse OpenAI response
   */
  private parseBotGenerationResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error parsing bot generation response:', error);
      throw error;
    }
  }

  /**
   * Generate avatar seed from bot name
   */
  private generateAvatarSeed(botName: string): string {
    return botName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Get user's bot twin
   */
  async getUserBotTwin(userId: string): Promise<BotTwin | null> {
    try {
      const { data, error } = await supabase
        .from('bot_twins')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user bot twin:', error);
      return null;
    }
  }

  /**
   * Get all active bot twins
   */
  async getActiveBotTwins(): Promise<BotTwin[]> {
    try {
      const { data, error } = await supabase
        .from('active_bot_twins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active bot twins:', error);
      return [];
    }
  }

  /**
   * Get bot interaction feed
   */
  async getBotInteractionFeed(limit: number = 50): Promise<BotInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('bot_interaction_feed')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bot interaction feed:', error);
      return [];
    }
  }

  /**
   * Create a bot interaction
   */
  async createBotInteraction(interaction: Omit<BotInteraction, 'id' | 'created_at'>): Promise<BotInteraction | null> {
    try {
      const { data, error } = await supabase
        .from('bot_interactions')
        .insert(interaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bot interaction:', error);
      return null;
    }
  }

  /**
   * Schedule bot interactions
   */
  async scheduleBotInteractions(): Promise<void> {
    try {
      const activeBots = await this.getActiveBotTwins();
      
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
      console.error('Error scheduling bot interactions:', error);
    }
  }

  /**
   * Queue a bot interaction
   */
  private async queueBotInteraction(botId: string): Promise<void> {
    try {
      const activeBots = await this.getActiveBotTwins();
      const otherBots = activeBots.filter(bot => bot.id !== botId);
      
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

export function createBotTwinService(apiKey: string): BotTwinService {
  return new BotTwinService(apiKey);
}

