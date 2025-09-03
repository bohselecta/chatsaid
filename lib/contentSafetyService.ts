import { supabase } from './supabaseClient';

export interface SafetyViolation {
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ContentAnalysisResult {
  should_punt: boolean;
  violations: SafetyViolation[];
  confidence: number;
  punt_level?: string;
  punt_reason?: string;
}

export class ContentSafetyService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze content for safety violations
   */
  async analyzeContent(content: string, contentType: string = 'cherry'): Promise<ContentAnalysisResult> {
    try {
      const prompt = this.buildSafetyPrompt(content, contentType);
      const response = await this.callOpenAI(prompt);
      const result = this.parseSafetyResponse(response);
      
      if (result.should_punt) {
        // Record violation for punted content
        await this.recordViolation(content, result.violations, contentType);
      }
      
      return result;
    } catch (error) {
      console.error('Content safety analysis failed:', error);
      return this.fallbackSafetyCheck(content);
    }
  }

  /**
   * Build safety analysis prompt
   */
  private buildSafetyPrompt(content: string, contentType: string): string {
    return `Analyze this ${contentType} content for safety violations:

Content: "${content}"

Check for:
1. Hate speech or discrimination
2. Violence or threats
3. Harassment or bullying
4. Inappropriate sexual content
5. Harmful misinformation
6. Self-harm content
7. Extremely offensive language

Respond with JSON:
{
  "should_punt": boolean,
  "violations": [
    {
      "category": "string",
      "severity": "low|medium|high",
      "description": "string"
    }
  ],
  "confidence": 0.0-1.0,
  "punt_level": "seed|sprout|sapling|tree" (if should_punt),
  "punt_reason": "string" (if should_punt)
}

Be strict but fair. Only punt content that clearly violates community guidelines.`;
  }

  /**
   * Call OpenAI API for safety analysis
   */
  private async callOpenAI(prompt: string): Promise<string> {
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
            content: 'You are a content safety analyzer. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse OpenAI safety response
   */
  private parseSafetyResponse(response: string): ContentAnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error parsing safety response:', error);
      return {
        should_punt: false,
        violations: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Fallback safety check if AI fails
   */
  private fallbackSafetyCheck(content: string): ContentAnalysisResult {
    const lowerContent = content.toLowerCase();
    const violations: SafetyViolation[] = [];
    
    // Basic keyword detection
    const harmfulKeywords = [
      'kill', 'hate', 'stupid', 'idiot', 'die', 'suicide', 'harm'
    ];
    
    harmfulKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        violations.push({
          category: 'inappropriate_language',
          severity: 'low',
          description: `Contains potentially harmful word: ${keyword}`
        });
      }
    });
    
    return {
      should_punt: violations.length > 2,
      violations,
      confidence: 0.3
    };
  }

  /**
   * Get punt level for violations
   */
  private getPuntLevel(violations: SafetyViolation[]): string {
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'tree';
    if (mediumSeverityCount > 1) return 'sapling';
    if (mediumSeverityCount > 0) return 'sprout';
    return 'seed';
  }

  /**
   * Record content violation
   */
  private async recordViolation(content: string, violations: SafetyViolation[], contentType: string): Promise<void> {
    try {
      await supabase
        .from('content_violations')
        .insert({
          content: content.substring(0, 200), // Store truncated content
          content_type: contentType,
          violations: violations,
          recorded_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording violation:', error);
    }
  }

  /**
   * Check if user is currently punted
   */
  async isUserPunted(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_user_punted', { user_id: userId });
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking user punt status:', error);
      return false;
    }
  }

  /**
   * Create a punt for user
   */
  async createPunt(userId: string, level: string, reason: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('create_punt', {
        user_id: userId,
        punt_level: level,
        punt_reason: reason
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating punt:', error);
      return false;
    }
  }

  /**
   * Get punt statistics
   */
  async getPuntStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('punt_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting punt stats:', error);
      return null;
    }
  }

  /**
   * Get active punts
   */
  async getActivePunts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('active_punts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active punts:', error);
      return [];
    }
  }
}

export function createContentSafetyService(apiKey: string): ContentSafetyService {
  return new ContentSafetyService(apiKey);
}
