import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCacheService } from '../../../lib/cacheService';
import { getBackgroundWorker } from '../../../lib/backgroundWorker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cacheService = getCacheService();
const backgroundWorker = getBackgroundWorker();

// Cherry generation configuration
const CHERRY_CONFIG = {
  maxSuggestions: 5,
  minSuggestions: 2,
  cacheTTL: 900, // 15 minutes
  moods: [
    'inspirational', 'whimsical', 'thoughtful', 'playful', 
    'serious', 'creative', 'analytical', 'emotional', 'curious'
  ]
};

interface CherrySuggestion {
  id: string;
  prompt: string;
  mood?: string;
  style_seed?: string;
  cherry_text: string;
  provenance: {
    source: string;
    confidence: number;
    reasoning: string;
    bot_version: string;
  };
  score: number;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, mood, style_seed } = await request.json();
    
    // Get user from session (implement your auth logic)
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Validate mood if provided
    if (mood && !CHERRY_CONFIG.moods.includes(mood)) {
      return NextResponse.json({ 
        error: `Invalid mood. Must be one of: ${CHERRY_CONFIG.moods.join(', ')}` 
      }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${prompt}:${mood || 'default'}:${style_seed || 'none'}`;
    const cachedCherries = await cacheService.getCherries(userId, cacheKey);
    if (cachedCherries) {
      return NextResponse.json({ cherries: cachedCherries });
    }

    // Get user's watchlist and persona for context
    const [watchlist, persona] = await Promise.all([
      getUserWatchlist(userId),
      getUserPersona(userId)
    ]);

    // Generate cherry suggestions
    const cherrySuggestions = await generateCherrySuggestions(
      prompt, 
      mood, 
      style_seed, 
      userId, 
      watchlist, 
      persona
    );

    // Score and rank the suggestions
    const scoredCherries = await scoreCherrySuggestions(
      cherrySuggestions, 
      userId, 
      watchlist, 
      persona
    );

    // Take top suggestions
    const topCherries = scoredCherries
      .sort((a, b) => b.score - a.score)
      .slice(0, CHERRY_CONFIG.maxSuggestions);

    // Save suggestions to database
    const savedCherries = await Promise.all(
      topCherries.map(async (cherry) => {
        const { data, error } = await supabase
          .from('bot_cherry_suggestions')
          .insert({
            user_id: userId,
            prompt: prompt.trim(),
            mood: mood || null,
            style_seed: style_seed || null,
            cherry_text: cherry.cherry_text,
            provenance: cherry.provenance,
            score: cherry.score,
            status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving cherry suggestion:', error);
          return null;
        }

        return data;
      })
    );

    const validCherries = savedCherries.filter(cherry => cherry !== null);

    // Cache the results
    await cacheService.setCherries(userId, cacheKey, validCherries, CHERRY_CONFIG.cacheTTL);

    // Log the generation action
    await supabase
      .from('agent_actions')
      .insert({
        persona_id: persona?.id || 'system',
        action_type: 'cherry_generated',
        target_id: validCherries[0]?.id,
        metadata: {
          prompt,
          mood,
          style_seed,
          count: validCherries.length,
          scores: validCherries.map(c => c.score)
        }
      });

    return NextResponse.json({ 
      cherries: validCherries,
      metadata: {
        prompt,
        mood,
        style_seed,
        generated_at: new Date().toISOString(),
        count: validCherries.length
      }
    });

  } catch (error) {
    console.error('Cherry generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cherry suggestions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate status
    if (!['pending', 'selected', 'discarded', 'edited'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `status:${status}`;
    const cachedCherries = await cacheService.getCherries(userId, cacheKey);
    if (cachedCherries) {
      return NextResponse.json({ cherries: cachedCherries });
    }

    // Fetch from database
    const { data: cherries, error } = await supabase
      .from('bot_cherry_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching cherry suggestions:', error);
      return NextResponse.json({ error: 'Failed to fetch cherry suggestions' }, { status: 500 });
    }

    // Cache the results
    await cacheService.setCherries(userId, cacheKey, cherries || [], 300); // 5 minutes

    return NextResponse.json({ cherries: cherries || [] });

  } catch (error) {
    console.error('Cherry fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, cherry_text } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status
    if (!['selected', 'discarded', 'edited'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the cherry suggestion
    const { data: cherry, error: fetchError } = await supabase
      .from('bot_cherry_suggestions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !cherry) {
      return NextResponse.json({ error: 'Cherry suggestion not found' }, { status: 404 });
    }

    // Update the cherry suggestion
    const updateData: any = { status };
    if (status === 'edited' && cherry_text) {
      updateData.cherry_text = cherry_text;
    }

    const { data: updatedCherry, error: updateError } = await supabase
      .from('bot_cherry_suggestions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating cherry suggestion:', updateError);
      return NextResponse.json({ error: 'Failed to update cherry suggestion' }, { status: 500 });
    }

    // If selected, add to user cherry buckets
    if (status === 'selected') {
      const { error: bucketError } = await supabase
        .from('user_cherry_buckets')
        .insert({
          user_id: userId,
          cherry_id: id, // Reference to the suggestion
          category: 'ideas', // Default category, can be made configurable
          cherry_text: cherry.cherry_text,
          provenance: cherry.provenance,
          source: 'bot_generated',
          original_suggestion_id: id
        });

      if (bucketError) {
        console.error('Error adding to cherry bucket:', bucketError);
        // Don't fail the request, just log the error
      }
    }

    // Invalidate cache
    await cacheService.invalidateCherries(userId);

    // Log the action
    await supabase
      .from('agent_actions')
      .insert({
        persona_id: cherry.user_id,
        action_type: `cherry_${status}`,
        target_id: id,
        metadata: {
          original_prompt: cherry.prompt,
          mood: cherry.mood,
          score: cherry.score
        }
      });

    return NextResponse.json({ 
      success: true,
      cherry: updatedCherry,
      message: `Cherry ${status} successfully`
    });

  } catch (error) {
    console.error('Cherry update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getUserWatchlist(userId: string) {
  const cachedWatchlist = await cacheService.getWatchlist(userId);
  if (cachedWatchlist) {
    return cachedWatchlist;
  }

  const { data } = await supabase
    .from('watchlists')
    .select('kind, value, weight')
    .eq('user_id', userId);

  const watchlist = data || [];
  await cacheService.setWatchlist(userId, watchlist);
  return watchlist;
}

async function getUserPersona(userId: string) {
  const cachedPersona = await cacheService.getPersona(userId);
  if (cachedPersona) {
    return cachedPersona;
  }

  const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    await cacheService.setPersona(userId, data);
  }

  return data;
}

async function generateCherrySuggestions(
  prompt: string,
  mood: string | undefined,
  style_seed: string | undefined,
  userId: string,
  watchlist: any[],
  persona: any
): Promise<CherrySuggestion[]> {
  // This is where you'd integrate with your LLM service
  // For now, we'll generate mock suggestions based on the prompt and mood
  
  const suggestions: CherrySuggestion[] = [];
  const basePrompt = prompt.trim();
  const moodContext = mood ? ` in a ${mood} tone` : '';
  const styleContext = style_seed ? ` inspired by: "${style_seed.substring(0, 100)}..."` : '';

  // Generate 3-5 suggestions with different approaches
  const approaches = [
    'direct response',
    'metaphorical interpretation',
    'question-based exploration',
    'creative expansion',
    'practical application'
  ];

  for (let i = 0; i < Math.min(approaches.length, CHERRY_CONFIG.maxSuggestions); i++) {
    const approach = approaches[i];
    const cherryText = generateCherryText(basePrompt, mood, approach, style_seed);
    
    suggestions.push({
      id: `temp_${Date.now()}_${i}`,
      prompt: basePrompt,
      mood: mood || null,
      style_seed: style_seed || null,
      cherry_text: cherryText,
      provenance: {
        source: 'bot_generation',
        confidence: 0.7 + (Math.random() * 0.3), // 0.7-1.0
        reasoning: `Generated using ${approach} approach${moodContext}${styleContext}`,
        bot_version: '1.0.0'
      },
      score: 0, // Will be calculated later
      created_at: new Date().toISOString()
    });
  }

  return suggestions;
}

function generateCherryText(prompt: string, mood: string | undefined, approach: string, style_seed: string | undefined): string {
  // Mock cherry text generation - in production, this would call your LLM
  const moodModifiers = {
    inspirational: ['inspiring', 'uplifting', 'motivational'],
    whimsical: ['playful', 'imaginative', 'delightful'],
    thoughtful: ['contemplative', 'reflective', 'deep'],
    playful: ['fun', 'lighthearted', 'cheerful'],
    serious: ['earnest', 'profound', 'meaningful'],
    creative: ['innovative', 'artistic', 'original'],
    analytical: ['logical', 'systematic', 'methodical'],
    emotional: ['heartfelt', 'passionate', 'moving'],
    curious: ['inquisitive', 'exploratory', 'wondering']
  };

  const moodWords = mood && moodModifiers[mood as keyof typeof moodModifiers] 
    ? moodModifiers[mood as keyof typeof moodModifiers] 
    : ['interesting', 'engaging', 'compelling'];

  const randomMood = moodWords[Math.floor(Math.random() * moodWords.length)];

  const templates = [
    `A ${randomMood} perspective on "${prompt}" that invites deeper reflection.`,
    `What if we approached "${prompt}" from a completely different angle?`,
    `The hidden beauty in "${prompt}" lies in its potential to transform our understanding.`,
    `"${prompt}" - a simple concept that opens doors to infinite possibilities.`,
    `Sometimes the most profound insights come from the simplest questions about "${prompt}".`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

async function scoreCherrySuggestions(
  suggestions: CherrySuggestion[],
  userId: string,
  watchlist: any[],
  persona: any
): Promise<CherrySuggestion[]> {
  // Use the existing scoring system from the agent layer
  const scoredSuggestions = suggestions.map(suggestion => {
    const score = calculateCherryScore(suggestion, watchlist, persona);
    return { ...suggestion, score };
  });

  return scoredSuggestions;
}

function calculateCherryScore(suggestion: CherrySuggestion, watchlist: any[], persona: any): number {
  // Simplified scoring based on existing agent scoring logic
  let score = 0.5; // Base score

  // Boost score based on watchlist relevance
  const watchlistRelevance = calculateWatchlistRelevance(suggestion.cherry_text, watchlist);
  score += watchlistRelevance * 0.3;

  // Boost score based on provenance confidence
  score += suggestion.provenance.confidence * 0.2;

  // Boost score for mood alignment (if specified)
  if (suggestion.mood) {
    score += 0.1;
  }

  // Boost score for style seed usage
  if (suggestion.style_seed) {
    score += 0.1;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

function calculateWatchlistRelevance(text: string, watchlist: any[]): number {
  let relevance = 0;
  let totalWeight = 0;

  for (const item of watchlist) {
    const weight = item.weight || 1.0;
    const matches = (text.toLowerCase().match(new RegExp(item.value.toLowerCase(), 'g')) || []).length;
    if (matches > 0) {
      relevance += weight * Math.min(matches, 3); // Cap at 3 matches
    }
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.min(relevance / totalWeight, 1) : 0.1;
}
