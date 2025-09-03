export interface Cherry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  branch_type: string;
  twig_name?: string;
  source_file?: string;
  line_number?: number;
  image_url?: string;
  review_status: string;
}

export interface InsightResult {
  summary: string;
  patterns: string[];
  goals: string[];
  connections: string[];
  recommendations: string[];
}

export class AIInsightsService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async analyzeCherries(cherries: Cherry[]): Promise<InsightResult> {
    try {
      // For now, return mock insights
      // TODO: Implement actual OpenAI API call
      return this.generateMockInsights(cherries);
    } catch (error) {
      console.error('Error analyzing cherries:', error);
      throw new Error('Failed to analyze cherries');
    }
  }

  private generateMockInsights(cherries: Cherry[]): InsightResult {
    const branchCounts = cherries.reduce((acc, cherry) => {
      acc[cherry.branch_type] = (acc[cherry.branch_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantBranch = Object.entries(branchCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    const timePatterns = this.analyzeTimePatterns(cherries);
    const contentPatterns = this.analyzeContentPatterns(cherries);
    const sourcePatterns = this.analyzeSourcePatterns(cherries);

    return {
      summary: `Based on your ${cherries.length} cherries, I've discovered fascinating patterns that reveal your AI conversation journey.`,
      patterns: [
        `You're most active in the ${dominantBranch} branch (${branchCounts[dominantBranch]} cherries)`,
        timePatterns,
        contentPatterns,
        sourcePatterns
      ],
      goals: [
        `Explore more ${dominantBranch === 'technical' ? 'creative' : 'technical'} content to balance your interests`,
        'Build deeper connections between related cherries',
        'Review and refine your most impactful conversations'
      ],
      connections: [
        'Your technical cherries often reference similar concepts',
        'Time-based clusters suggest focused thinking sessions',
        'Source file patterns indicate project-based organization'
      ],
      recommendations: [
        'Consider creating a "learning path" connecting related technical concepts',
        'Set aside time for regular review and reflection on your conversations',
        'Explore cross-branch connections to discover new insights'
      ]
    };
  }

  private analyzeTimePatterns(cherries: Cherry[]): string {
    const sortedCherries = [...cherries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const timeGaps = [];
    for (let i = 1; i < sortedCherries.length; i++) {
      const gap = new Date(sortedCherries[i].created_at).getTime() - 
                  new Date(sortedCherries[i-1].created_at).getTime();
      timeGaps.push(gap);
    }

    const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
    const avgDays = avgGap / (1000 * 60 * 60 * 24);

    if (avgDays < 1) return 'You create cherries frequently, often multiple times per day';
    if (avgDays < 3) return 'You maintain consistent engagement, creating cherries every few days';
    if (avgDays < 7) return 'You have a weekly rhythm for capturing AI conversations';
    return 'You create cherries periodically, building a thoughtful collection over time';
  }

  private analyzeContentPatterns(cherries: Cherry[]): string {
    const allContent = cherries.map(c => c.content.toLowerCase()).join(' ');
    const words = allContent.split(/\s+/).filter(word => word.length > 3);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return `Common themes include: ${topWords.join(', ')}`;
  }

  private analyzeSourcePatterns(cherries: Cherry[]): string {
    const sourceFiles = cherries
      .filter(c => c.source_file)
      .map(c => c.source_file);

    if (sourceFiles.length === 0) return 'No source files recorded yet';

    const uniqueSources = new Set(sourceFiles);
    if (uniqueSources.size === 1) return 'All cherries come from a single source file';
    if (uniqueSources.size < 5) return `Cherries span ${uniqueSources.size} different source files`;
    return `Cherries are distributed across ${uniqueSources.size} different source files`;
  }

  // TODO: Implement actual OpenAI API call
  async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
            content: 'You are an AI analyst helping users understand patterns in their AI conversations. Provide insightful, actionable analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';
  }
}

// Factory function for creating insights service
export function createAIInsightsService(apiKey: string): AIInsightsService {
  return new AIInsightsService(apiKey);
}
