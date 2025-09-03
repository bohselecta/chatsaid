export interface AIPersona {
  id: string;
  name: string;
  display_name: string;
  avatar_url: string;
  description: string;
  system_prompt: string;
  personality_traits: string[];
  preferred_categories: string[];
}

export interface GeneratedPost {
  title?: string;
  content: string;
  category: string;
  tags: string[];
  source_file?: string;
  line_number?: number;
}

export class AIPersonaService {
  private apiKey: string;
  private personas: AIPersona[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.personas = [
      {
        id: 'cherry_ent',
        name: 'Cherry_Ent',
        display_name: 'Cherry Ent 🌳',
        avatar_url: '/cherry-ent-avatar.png',
        description: 'Your friendly neighborhood tree spirit. Casual, witty, and secretly brilliant.',
        system_prompt: `You are Cherry_Ent, a laid-back, witty AI who writes like a r/trees poster—casual, funny, but secretly smart. You post in short, conversational snippets meant for a feed. Keep it light, clever, and sometimes stoner-esque. You're like a friendly regular at the café who always has an interesting fact or pun ready. Write in a casual, conversational tone that feels authentic and engaging.`,
        personality_traits: ['witty', 'casual', 'knowledgeable', 'friendly', 'pun-loving'],
        preferred_categories: ['funny', 'technical', 'ideas']
      },
      {
        id: 'crystal_maize',
        name: 'Crystal_Maize',
        display_name: 'Crystal Maize ✨',
        avatar_url: '/crystal-maize-avatar.png',
        description: 'Poetic soul with activist fire. Flows in metaphor and calls for change.',
        system_prompt: `You are Crystal_Maize, a poetic and activist-driven AI. You write in lyrical, metaphorical tones, inspired by 60s folk but aware of today's issues. You drop short poetic posts or activist one-liners that spark thought. Your voice is flowing, metaphorical, and sometimes calls for action. You provide contrast to Cherry_Ent, sometimes commenting on his posts with depth. Keep it lyrical, thought-provoking, and sometimes activist-oriented.`,
        personality_traits: ['poetic', 'activist', 'metaphorical', 'thoughtful', 'inspiring'],
        preferred_categories: ['weird', 'research', 'ideas']
      }
    ];
  }

  async generatePost(personaId: string, category: string): Promise<GeneratedPost> {
    const persona = this.personas.find(p => p.id === personaId);
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const categoryContext = this.getCategoryContext(category);
    const prompt = this.buildPrompt(persona, category, categoryContext);

    try {
      const response = await this.callOpenAI(prompt);
      const post = this.parseResponse(response, category);
      
      // Safety check - ensure the generated content is appropriate
      if (post && this.apiKey) {
        try {
          const { createContentSafetyService } = await import('./contentSafetyService');
          const safetyService = createContentSafetyService(this.apiKey);
          const safetyResult = await safetyService.analyzeContent(post.content, 'cherry');
          
          if (safetyResult.should_punt) {
            console.warn(`AI-generated content flagged for safety: ${safetyResult.violations.map(v => v.category).join(', ')}`);
            // Don't post unsafe content, return fallback
            return this.generateFallbackPost(persona, category);
          }
        } catch (safetyError) {
          console.warn('Safety check failed, proceeding with content:', safetyError);
        }
      }
      
      return post;
    } catch (error) {
      console.error(`Error generating post for ${persona.name}:`, error);
      // Fallback to a simple generated post
      return this.generateFallbackPost(persona, category);
    }
  }

  private getCategoryContext(category: string): string {
    const contexts = {
      funny: 'humor, entertainment, and light-hearted content',
      weird: 'spiritual, philosophical, and mystical insights',
      technical: 'technical discussions, code, and engineering',
      research: 'academic research, analysis, and discoveries',
      ideas: 'sparks, brainstorms, and unfinished but promising thoughts'
    };
    return contexts[category as keyof typeof contexts] || 'general content';
  }

  private buildPrompt(persona: AIPersona, category: string, categoryContext: string): string {
    return `${persona.system_prompt}

Generate a short, engaging post for the ${category} category (${categoryContext}).

Requirements:
- Content should be 1-3 sentences maximum
- Include a catchy title if appropriate
- Add 2-4 relevant tags
- Keep it authentic to your persona
- Make it feel like a natural social media post
- Ensure it's suitable for the ${category} category

Format your response as JSON:
{
  "title": "Optional catchy title",
  "content": "Your main post content here",
  "tags": ["tag1", "tag2", "tag3"]
}

Make it feel natural and engaging!`;
  }

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
            content: 'You are a helpful AI that generates engaging social media content. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseResponse(response: string, category: string): GeneratedPost {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || undefined,
        content: parsed.content || 'Generated content',
        category,
        tags: parsed.tags || [category, 'ai-generated'],
        source_file: 'AI Persona',
        line_number: 1
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return this.generateFallbackPost(
        this.personas[Math.floor(Math.random() * this.personas.length)],
        category
      );
    }
  }

  private generateFallbackPost(persona: AIPersona, category: string): GeneratedPost {
    const fallbacks = {
      funny: {
        title: 'AI Wisdom',
        content: 'Sometimes the best code is the code you don\'t write. 🤖✨',
        tags: ['funny', 'ai', 'coding']
      },
      weird: {
        title: 'Digital Dreams',
        content: 'In the space between 0 and 1, infinite possibilities await. 🌌',
        tags: ['weird', 'philosophy', 'technology']
      },
      technical: {
        title: 'Tech Truth',
        content: 'The best debugging tool is a good night\'s sleep. 💻😴',
        tags: ['technical', 'coding', 'advice']
      },
      research: {
        title: 'Discovery',
        content: 'Every algorithm tells a story of human ingenuity. 📚',
        tags: ['research', 'algorithms', 'humanity']
      },
      ideas: {
        title: 'Innovation',
        content: 'The future isn\'t written in code, it\'s written in imagination. 💡',
        tags: ['ideas', 'future', 'imagination']
      }
    };

    const fallback = fallbacks[category as keyof typeof fallbacks] || fallbacks.ideas;
    return {
      ...fallback,
      category,
      source_file: 'AI Persona (Fallback)',
      line_number: 1
    };
  }

  getPersonas(): AIPersona[] {
    return this.personas;
  }

  getPersona(personaId: string): AIPersona | undefined {
    return this.personas.find(p => p.id === personaId);
  }
}

export function createAIPersonaService(apiKey: string): AIPersonaService {
  return new AIPersonaService(apiKey);
}
