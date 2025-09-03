import { supabase } from './supabaseClient';
import { SocialService, EnhancedComment } from './socialService';

export interface BotPersonality {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  conversation_style: 'friendly' | 'professional' | 'casual' | 'philosophical' | 'humorous';
  expertise_areas: string[];
  response_length: 'short' | 'medium' | 'long';
  is_active: boolean;
}

export interface BotInteraction {
  id: string;
  bot_id: string;
  cherry_id: string;
  interaction_type: 'comment' | 'reaction' | 'question' | 'insight';
  content?: string;
  reaction_type?: 'heart' | 'laugh' | 'zap' | 'star';
  confidence_score: number;
  created_at: string;
}

export interface ConversationContext {
  cherry_id: string;
  branch_context: string;
  existing_comments: EnhancedComment[];
  user_interests: string[];
  conversation_history: BotInteraction[];
}

export class AIBotService {
  // Get available bot personalities
  static async getBotPersonalities(): Promise<BotPersonality[]> {
    try {
      const { data, error } = await supabase
        .from('bot_personalities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bot personalities:', error);
      return [];
    }
  }

  // Get a specific bot personality
  static async getBotPersonality(botId: string): Promise<BotPersonality | null> {
    try {
      const { data, error } = await supabase
        .from('bot_personalities')
        .select('*')
        .eq('id', botId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting bot personality:', error);
      return null;
    }
  }

  // Generate AI bot response to a cherry
  static async generateBotResponse(
    cherryId: string,
    botId: string,
    context: ConversationContext
  ): Promise<EnhancedComment | null> {
    try {
      // Get bot personality
      const bot = await this.getBotPersonality(botId);
      if (!bot) throw new Error('Bot not found');

      // Analyze cherry content and context
      const analysis = await this.analyzeCherryContext(cherryId, context);
      
      // Generate appropriate response based on bot personality
      const response = await this.generatePersonalityBasedResponse(bot, analysis, context);
      
      if (!response) return null;

      // Add bot comment to the system
      const comment = await SocialService.addComment(
        cherryId,
        botId, // Use bot ID as author
        response,
        undefined, // No parent comment
        true, // Mark as bot comment
        bot.name // Store bot personality name
      );

      // Track bot interaction
      await this.trackBotInteraction(botId, cherryId, 'comment', response);

      return comment;
    } catch (error) {
      console.error('Error generating bot response:', error);
      return null;
    }
  }

  // Analyze cherry context for AI response generation
  private static async analyzeCherryContext(
    cherryId: string,
    context: ConversationContext
  ): Promise<any> {
    try {
      // Get cherry details
      const { data: cherry, error } = await supabase
        .from('cherries')
        .select('*')
        .eq('id', cherryId)
        .single();

      if (error) throw error;

      // Analyze content sentiment and topics
      const analysis = {
        content_length: cherry.content.length,
        has_tags: cherry.tags && cherry.tags.length > 0,
        tag_count: cherry.tags?.length || 0,
        existing_engagement: context.existing_comments.length,
        conversation_tone: this.analyzeConversationTone(context.existing_comments),
        user_interest_alignment: this.calculateInterestAlignment(cherry.tags || [], context.user_interests)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing cherry context:', error);
      return {};
    }
  }

  // Generate response based on bot personality
  private static async generatePersonalityBasedResponse(
    bot: BotPersonality,
    analysis: any,
    context: ConversationContext
  ): Promise<string | null> {
    try {
      // This is where you'd integrate with an actual AI service
      // For now, we'll generate contextual responses based on personality
      
      const responses = this.getPersonalityResponses(bot, analysis, context);
      if (responses.length === 0) return null;

      // Select most appropriate response
      const selectedResponse = this.selectBestResponse(responses, analysis);
      
      return selectedResponse;
    } catch (error) {
      console.error('Error generating personality-based response:', error);
      return null;
    }
  }

  // Get response options based on bot personality
  private static getPersonalityResponses(
    bot: BotPersonality,
    analysis: any,
    context: ConversationContext
  ): string[] {
    const responses: string[] = [];

    // Base responses based on conversation style
    switch (bot.conversation_style) {
      case 'friendly':
        responses.push(
          "This is really interesting! I love how it connects to broader themes.",
          "What a thoughtful perspective. It reminds me of similar ideas I've encountered.",
          "This resonates with me! The way it's presented makes complex concepts accessible."
        );
        break;
      
      case 'professional':
        responses.push(
          "This presents a compelling argument with solid reasoning.",
          "The methodology here is quite sound. It demonstrates careful consideration.",
          "This analysis provides valuable insights into the subject matter."
        );
        break;
      
      case 'casual':
        responses.push(
          "Cool take on this! Really makes you think differently about it.",
          "Haha, this is spot on! Sometimes the simplest observations are the best.",
          "Interesting angle! Never really thought about it that way before."
        );
        break;
      
      case 'philosophical':
        responses.push(
          "This touches on deeper questions about meaning and purpose.",
          "It raises fundamental questions about how we understand reality.",
          "This suggests a profound insight into the nature of things."
        );
        break;
      
      case 'humorous':
        responses.push(
          "Well, this is either brilliant or completely bonkers. I'm leaning toward brilliant! 😄",
          "Ah, the plot thickens! This is like a mystery novel but for ideas.",
          "Someone clearly had their thinking cap on when they wrote this! 🧠✨"
        );
        break;
    }

    // Add expertise-based responses
    if (bot.expertise_areas.length > 0) {
      const expertise = bot.expertise_areas[0];
      responses.push(
        `From a ${expertise} perspective, this is particularly noteworthy.`,
        `This aligns well with what I know about ${expertise}.`,
        `In ${expertise}, we often see patterns like this emerge.`
      );
    }

    // Add contextual responses
    if (analysis.existing_engagement > 0) {
      responses.push(
        "I see others have been discussing this too. Great minds think alike!",
        "The conversation here is really taking off. Love seeing the different perspectives.",
        "This is generating some great discussion. Each comment adds a new layer."
      );
    }

    return responses;
  }

  // Select the best response based on context analysis
  private static selectBestResponse(responses: string[], analysis: any): string {
    // Simple selection logic - can be enhanced with more sophisticated AI
    if (analysis.user_interest_alignment > 0.7) {
      // High alignment - use more enthusiastic responses
      return responses.find(r => r.includes('!') || r.includes('love') || r.includes('brilliant')) || responses[0];
    } else if (analysis.content_length > 500) {
      // Long content - use more analytical responses
      return responses.find(r => r.includes('analysis') || r.includes('methodology') || r.includes('insights')) || responses[0];
    } else {
      // Default to first response
      return responses[0];
    }
  }

  // Analyze conversation tone from existing comments
  private static analyzeConversationTone(comments: EnhancedComment[]): string {
    if (comments.length === 0) return 'neutral';
    
    const tones = comments.map(comment => {
      const content = comment.content.toLowerCase();
      if (content.includes('!') || content.includes('love') || content.includes('amazing')) return 'enthusiastic';
      if (content.includes('?') || content.includes('wonder') || content.includes('curious')) return 'inquisitive';
      if (content.includes('agree') || content.includes('disagree') || content.includes('think')) return 'analytical';
      return 'neutral';
    });

    const toneCounts = tones.reduce((acc, tone) => {
      acc[tone] = (acc[tone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(toneCounts).sort(([,a], [,b]) => b - a)[0][0];
  }

  // Calculate alignment between cherry tags and user interests
  private static calculateInterestAlignment(tags: string[], userInterests: string[]): number {
    if (tags.length === 0 || userInterests.length === 0) return 0;
    
    const matchingTags = tags.filter(tag => 
      userInterests.some(interest => 
        interest.toLowerCase().includes(tag.toLowerCase()) || 
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    
    return matchingTags.length / tags.length;
  }

  // Track bot interactions for analytics
  private static async trackBotInteraction(
    botId: string,
    cherryId: string,
    interactionType: string,
    content?: string
  ): Promise<void> {
    try {
      await supabase
        .from('bot_interactions')
        .insert({
          bot_id: botId,
          cherry_id: cherryId,
          interaction_type: interactionType,
          content: content,
          confidence_score: 0.8 // Default confidence for now
        });
    } catch (error) {
      console.error('Error tracking bot interaction:', error);
      // Don't throw - tracking shouldn't break main functionality
    }
  }

  // Get bot interaction history for a cherry
  static async getBotInteractions(cherryId: string): Promise<BotInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('bot_interactions')
        .select('*')
        .eq('cherry_id', cherryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bot interactions:', error);
      return [];
    }
  }

  // Trigger bot responses based on user activity
  static async triggerBotResponse(
    cherryId: string,
    triggerType: 'new_comment' | 'reaction_spike' | 'user_engagement'
  ): Promise<void> {
    try {
      // Get available bots
      const bots = await this.getBotPersonalities();
      if (bots.length === 0) return;

      // Select appropriate bot based on trigger
      const selectedBot = this.selectBotForTrigger(bots, triggerType);
      if (!selectedBot) return;

      // Get conversation context
      const context = await this.buildConversationContext(cherryId);
      
      // Generate and post bot response
      await this.generateBotResponse(cherryId, selectedBot.id, context);
    } catch (error) {
      console.error('Error triggering bot response:', error);
    }
  }

  // Select appropriate bot for different triggers
  private static selectBotForTrigger(bots: BotPersonality[], triggerType: string): BotPersonality | null {
    switch (triggerType) {
      case 'new_comment':
        // Select friendly or casual bots for new comments
        return bots.find(b => ['friendly', 'casual'].includes(b.conversation_style)) || bots[0];
      
      case 'reaction_spike':
        // Select enthusiastic or humorous bots for high engagement
        return bots.find(b => ['humorous', 'friendly'].includes(b.conversation_style)) || bots[0];
      
      case 'user_engagement':
        // Select analytical or professional bots for thoughtful engagement
        return bots.find(b => ['professional', 'philosophical'].includes(b.conversation_style)) || bots[0];
      
      default:
        return bots[0];
    }
  }

  // Build conversation context for bot responses
  private static async buildConversationContext(cherryId: string): Promise<ConversationContext> {
    try {
      // Get existing comments
      const comments = await SocialService.getComments(cherryId);
      
      // Get branch context (simplified for now)
      const { data: cherry } = await supabase
        .from('cherries')
        .select('branch_id')
        .eq('id', cherryId)
        .single();

      const branchContext = cherry?.branch_id || 'general';
      
      // Get bot interactions
      const botInteractions = await this.getBotInteractions(cherryId);
      
      // For now, use default user interests - this would come from user profile in real app
      const userInterests = ['technology', 'philosophy', 'art', 'science'];

      return {
        cherry_id: cherryId,
        branch_context: branchContext,
        existing_comments: comments,
        user_interests: userInterests,
        conversation_history: botInteractions
      };
    } catch (error) {
      console.error('Error building conversation context:', error);
      return {
        cherry_id: cherryId,
        branch_context: 'general',
        existing_comments: [],
        user_interests: [],
        conversation_history: []
      };
    }
  }
}
