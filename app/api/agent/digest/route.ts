import { NextRequest, NextResponse } from 'next/server';
import { guard } from '@/lib/server/featureGate'
import { createClient } from '@supabase/supabase-js';
import { getCacheService } from '../../../lib/cacheService';
import { getBackgroundWorker } from '../../../lib/backgroundWorker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cacheService = getCacheService();
const backgroundWorker = getBackgroundWorker();

// Scoring weights configuration
const WEIGHTS = {
  recency: 0.35,
  relevance: 0.30,
  affinity: 0.15,
  novelty: 0.10,
  provenance: 0.10
};

interface DigestItem {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  score: number;
  tldr?: string;
  provenance: {
    reason: string;
    matchType: string;
    confidence: number;
  };
  actions: {
    canOpen: boolean;
    canReply: boolean;
    canSave: boolean;
    canPing: boolean;
  };
}

interface DigestResult {
  highlights: DigestItem[];
  totalItems: number;
  timeWindow: {
    start: string;
    end: string;
  };
  summary: string;
  continueToken?: string;
}

export async function POST(request: NextRequest) {
  const blocked = guard('DIGEST')
  if (blocked) return blocked
  try {
    const { windowStart, windowEnd, continueToken, maxItems = 10 } = await request.json();
    
    // Get user from session (implement your auth logic)
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timeStart = windowStart ? new Date(windowStart) : await getLastActiveTime(userId);
    const timeEnd = windowEnd ? new Date(windowEnd) : new Date();
    
    const sliceKey = `${timeStart.toISOString()}_${timeEnd.toISOString()}`;

    // Check Redis cache first
    const cachedDigest = await cacheService.getDigest(userId, sliceKey);
    if (cachedDigest) {
      return NextResponse.json({ digest: cachedDigest });
    }

    // Check database cache as fallback
    const { data: cached } = await supabase
      .from('digest_cache')
      .select('summary_json, expires_at')
      .eq('user_id', userId)
      .eq('time_slice_key', sliceKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      // Update Redis cache
      await cacheService.setDigest(userId, sliceKey, cached.summary_json);
      return NextResponse.json({ digest: cached.summary_json });
    }

    // Get user's watchlist and persona
    const [watchlist, persona] = await Promise.all([
      getUserWatchlist(userId),
      getUserPersona(userId)
    ]);

    // Find candidate cherries
    const candidateIds = await lookupCandidateCherries(userId, watchlist, timeStart, timeEnd);
    
    if (candidateIds.length === 0) {
      const emptyDigest: DigestResult = {
        highlights: [],
        totalItems: 0,
        timeWindow: { start: timeStart.toISOString(), end: timeEnd.toISOString() },
        summary: 'No new cherries found in your watchlist since your last visit.'
      };
      
      // Cache empty result
      await cacheDigest(userId, sliceKey, emptyDigest);
      return NextResponse.json({ digest: emptyDigest });
    }

    // Fetch and score cherries
    const scoredItems = await fetchAndScoreCherries(candidateIds, userId, watchlist, persona);
    
    // Sort by score and take top items
    const topItems = scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    // Generate TL;DR for top items (expensive operation)
    const highlights = await Promise.all(
      topItems.map(async (item) => {
        const tldr = await generateTLDR(item.content, item.tags, watchlist);
        return {
          ...item,
          tldr,
          actions: {
            canOpen: true,
            canReply: true,
            canSave: true,
            canPing: persona?.autonomy_flags?.pingsAllowed || false
          }
        };
      })
    );

    const digest: DigestResult = {
      highlights,
      totalItems: scoredItems.length,
      timeWindow: { start: timeStart.toISOString(), end: timeEnd.toISOString() },
      summary: generateDigestSummary(highlights, scoredItems.length)
    };

    // Cache the result in both Redis and database
    await cacheDigest(userId, sliceKey, digest);
    await cacheService.setDigest(userId, sliceKey, digest);

    return NextResponse.json({ digest });

  } catch (error) {
    console.error('Digest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}

async function getLastActiveTime(userId: string): Promise<Date> {
  const { data: persona } = await supabase
    .from('personas')
    .select('last_active')
    .eq('user_id', userId)
    .single();

  return persona?.last_active ? new Date(persona.last_active) : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
}

async function getUserWatchlist(userId: string) {
  // Check Redis cache first
  const cachedWatchlist = await cacheService.getWatchlist(userId);
  if (cachedWatchlist) {
    return cachedWatchlist;
  }

  // Fetch from database
  const { data } = await supabase
    .from('watchlists')
    .select('kind, value, weight')
    .eq('user_id', userId);

  const watchlist = data || [];
  
  // Cache the result
  await cacheService.setWatchlist(userId, watchlist);
  
  return watchlist;
}

async function getUserPersona(userId: string) {
  // Check Redis cache first
  const cachedPersona = await cacheService.getPersona(userId);
  if (cachedPersona) {
    return cachedPersona;
  }

  // Fetch from database
  const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    // Cache the result
    await cacheService.setPersona(userId, data);
  }

  return data;
}

async function lookupCandidateCherries(
  userId: string,
  watchlist: any[],
  timeStart: Date,
  timeEnd: Date
): Promise<string[]> {
  // Build query based on watchlist
  let query = supabase
    .from('cherries')
    .select('id')
    .gte('created_at', timeStart.toISOString())
    .lte('created_at', timeEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(100); // Reasonable limit for scoring

  // Add watchlist filters
  const tagFilters = watchlist.filter(w => w.kind === 'tag').map(w => w.value);
  const categoryFilters = watchlist.filter(w => w.kind === 'category').map(w => w.value);
  const personFilters = watchlist.filter(w => w.kind === 'person').map(w => w.value);

  if (tagFilters.length > 0) {
    query = query.overlaps('tags', tagFilters);
  }

  if (categoryFilters.length > 0) {
    query = query.in('category', categoryFilters);
  }

  if (personFilters.length > 0) {
    query = query.in('author_id', personFilters);
  }

  const { data } = await query;
  return data?.map(item => item.id) || [];
}

async function fetchAndScoreCherries(
  cherryIds: string[],
  userId: string,
  watchlist: any[],
  persona: any
): Promise<DigestItem[]> {
  if (cherryIds.length === 0) return [];

  const { data: cherries } = await supabase
    .from('cherries')
    .select('*')
    .in('id', cherryIds);

  if (!cherries) return [];

  return cherries.map(cherry => {
    const score = calculateScore(cherry, watchlist, persona);
    const provenance = calculateProvenance(cherry, watchlist);
    
    return {
      id: cherry.id,
      title: cherry.title,
      content: cherry.content,
      author: cherry.author_display_name || 'Unknown',
      category: cherry.category,
      tags: cherry.tags || [],
      score,
      provenance
    };
  });
}

function calculateScore(cherry: any, watchlist: any[], persona: any): number {
  const now = new Date();
  const cherryTime = new Date(cherry.created_at);
  const timeDiff = now.getTime() - cherryTime.getTime();
  const maxTimeDiff = 24 * 60 * 60 * 1000; // 24 hours

  // Recency score (0-1)
  const recency = Math.max(0, 1 - (timeDiff / maxTimeDiff));

  // Relevance score (0-1)
  const relevance = calculateRelevance(cherry, watchlist);

  // Affinity score (0-1)
  const affinity = calculateAffinity(cherry, persona);

  // Novelty score (0-1) - simplified for MVP
  const novelty = 0.8; // Assume most content is novel

  // Provenance score (0-1)
  const provenance = calculateProvenanceScore(cherry);

  return (
    WEIGHTS.recency * recency +
    WEIGHTS.relevance * relevance +
    WEIGHTS.affinity * affinity +
    WEIGHTS.novelty * novelty +
    WEIGHTS.provenance * provenance
  );
}

function calculateRelevance(cherry: any, watchlist: any[]): number {
  let relevance = 0;
  let totalWeight = 0;

  for (const item of watchlist) {
    let match = false;
    
    switch (item.kind) {
      case 'tag':
        match = cherry.tags?.includes(item.value) || false;
        break;
      case 'category':
        match = cherry.category === item.value;
        break;
      case 'person':
        match = cherry.author_id === item.value;
        break;
      case 'keyword':
        match = cherry.title.toLowerCase().includes(item.value.toLowerCase()) ||
                cherry.content.toLowerCase().includes(item.value.toLowerCase());
        break;
    }

    if (match) {
      relevance += item.weight || 1.0;
    }
    totalWeight += item.weight || 1.0;
  }

  return totalWeight > 0 ? relevance / totalWeight : 0.1; // Default low relevance
}

function calculateAffinity(cherry: any, persona: any): number {
  // Simplified affinity calculation
  if (cherry.author_id === persona?.user_id) return 1.0; // Own content
  if (cherry.visibility === 'friends') return 0.8; // Friend content
  if (cherry.visibility === 'public') return 0.5; // Public content
  return 0.2; // Default
}

function calculateProvenanceScore(cherry: any): number {
  // Higher score for more trusted sources
  switch (cherry.visibility) {
    case 'private': return 1.0;
    case 'friends': return 0.8;
    case 'public': return 0.6;
    default: return 0.5;
  }
}

function calculateProvenance(cherry: any, watchlist: any[]): any {
  const matches = [];
  
  for (const item of watchlist) {
    let match = false;
    let matchType = '';
    
    switch (item.kind) {
      case 'tag':
        match = cherry.tags?.includes(item.value) || false;
        matchType = 'tag_match';
        break;
      case 'category':
        match = cherry.category === item.value;
        matchType = 'category_match';
        break;
      case 'person':
        match = cherry.author_id === item.value;
        matchType = 'person_follow';
        break;
      case 'keyword':
        match = cherry.title.toLowerCase().includes(item.value.toLowerCase()) ||
                cherry.content.toLowerCase().includes(item.value.toLowerCase());
        matchType = 'keyword_match';
        break;
    }

    if (match) {
      matches.push({ type: matchType, value: item.value, weight: item.weight });
    }
  }

  const primaryMatch = matches.sort((a, b) => (b.weight || 1) - (a.weight || 1))[0];
  
  return {
    reason: primaryMatch ? `Matched ${primaryMatch.type.replace('_', ' ')}: ${primaryMatch.value}` : 'General relevance',
    matchType: primaryMatch?.type || 'general',
    confidence: primaryMatch ? (primaryMatch.weight || 1) : 0.3
  };
}

async function generateTLDR(content: string, tags: string[], watchlist: any[]): Promise<string> {
  // Three-pass LLM summarization strategy
  try {
    // Pass 1: Index - Extract key concepts and themes
    const indexResult = await indexContent(content, tags, watchlist);
    
    // Pass 2: Preview - Generate initial summary
    const previewResult = await previewContent(content, indexResult, watchlist);
    
    // Pass 3: Summarize - Refine into final TL;DR
    const summaryResult = await summarizeContent(content, previewResult, indexResult, watchlist);
    
    return summaryResult;
  } catch (error) {
    console.error('LLM summarization error:', error);
    // Fallback to simple extraction
    return generateFallbackTLDR(content, tags, watchlist);
  }
}

async function indexContent(content: string, tags: string[], watchlist: any[]): Promise<any> {
  // Pass 1: Index - Extract key concepts, themes, and relevance markers
  const watchlistKeywords = watchlist.map(w => w.value).join(', ');
  const contentTags = tags.join(', ');
  
  const prompt = `Analyze this content and extract key information:

Content: "${content}"
Tags: ${contentTags}
User Interests: ${watchlistKeywords}

Extract:
1. Main topic/theme
2. Key concepts (3-5)
3. Relevance to user interests (high/medium/low)
4. Content type (tutorial, news, opinion, etc.)
5. Key entities mentioned

Respond in JSON format:
{
  "mainTopic": "string",
  "keyConcepts": ["concept1", "concept2"],
  "relevance": "high|medium|low",
  "contentType": "string",
  "entities": ["entity1", "entity2"],
  "relevanceScore": 0.8
}`;

  // In production, call your LLM service here
  // For now, return a structured analysis
  return {
    mainTopic: extractMainTopic(content),
    keyConcepts: extractKeyConcepts(content, watchlist),
    relevance: calculateRelevanceLevel(content, watchlist),
    contentType: determineContentType(content),
    entities: extractEntities(content),
    relevanceScore: calculateRelevanceScore(content, watchlist)
  };
}

async function previewContent(content: string, indexResult: any, watchlist: any[]): Promise<string> {
  // Pass 2: Preview - Generate initial summary focusing on user interests
  const watchlistKeywords = watchlist.map(w => w.value).join(', ');
  
  const prompt = `Create a preview summary of this content, focusing on aspects relevant to user interests:

Content: "${content}"
User Interests: ${watchlistKeywords}
Analysis: ${JSON.stringify(indexResult)}

Generate a 2-3 sentence preview that:
1. Captures the main point
2. Highlights relevance to user interests
3. Mentions key concepts
4. Keeps it under 150 characters

Focus on: ${indexResult.mainTopic}`;

  // In production, call your LLM service here
  // For now, generate a smart preview
  return generateSmartPreview(content, indexResult, watchlist);
}

async function summarizeContent(content: string, previewResult: string, indexResult: any, watchlist: any[]): Promise<string> {
  // Pass 3: Summarize - Refine into final TL;DR with provenance
  const prompt = `Create a final TL;DR summary based on the preview and analysis:

Content: "${content}"
Preview: "${previewResult}"
Analysis: ${JSON.stringify(indexResult)}

Generate a concise TL;DR that:
1. Is 1-2 sentences maximum
2. Captures the essence
3. Explains why it's relevant to the user
4. Includes provenance (why this was selected)
5. Is under 100 characters

Format: "TL;DR: [summary] (Relevant because: [reason])"`;

  // In production, call your LLM service here
  // For now, generate a refined summary
  return generateRefinedSummary(content, previewResult, indexResult, watchlist);
}

// Helper functions for fallback and analysis
function generateFallbackTLDR(content: string, tags: string[], watchlist: any[]): string {
  const maxLength = 100;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return content.substring(0, maxLength) + '...';
  
  // Find most relevant sentence based on watchlist keywords
  let bestSentence = sentences[0];
  let bestScore = 0;
  
  for (const sentence of sentences) {
    let score = 0;
    for (const item of watchlist) {
      if (sentence.toLowerCase().includes(item.value.toLowerCase())) {
        score += item.weight || 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  }
  
  return bestSentence.trim().substring(0, maxLength) + (bestSentence.length > maxLength ? '...' : '');
}

function extractMainTopic(content: string): string {
  // Simple topic extraction - in production, use NLP
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const sortedWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);
  return sortedWords[0]?.[0] || 'general';
}

function extractKeyConcepts(content: string, watchlist: any[]): string[] {
  const concepts: string[] = [];
  
  // Extract concepts from watchlist matches
  watchlist.forEach(item => {
    if (content.toLowerCase().includes(item.value.toLowerCase())) {
      concepts.push(item.value);
    }
  });
  
  // Extract additional concepts from content
  const words = content.toLowerCase().split(/\s+/);
  const conceptWords = words.filter(word => 
    word.length > 4 && 
    !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'].includes(word)
  );
  
  // Get top 3 unique concepts
  const uniqueConcepts = [...new Set(conceptWords)].slice(0, 3);
  concepts.push(...uniqueConcepts);
  
  return concepts.slice(0, 5);
}

function calculateRelevanceLevel(content: string, watchlist: any[]): string {
  const score = calculateRelevanceScore(content, watchlist);
  if (score > 0.7) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
}

function determineContentType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('tutorial') || lowerContent.includes('how to') || lowerContent.includes('step')) {
    return 'tutorial';
  }
  if (lowerContent.includes('news') || lowerContent.includes('announced') || lowerContent.includes('released')) {
    return 'news';
  }
  if (lowerContent.includes('i think') || lowerContent.includes('opinion') || lowerContent.includes('believe')) {
    return 'opinion';
  }
  if (lowerContent.includes('research') || lowerContent.includes('study') || lowerContent.includes('data')) {
    return 'research';
  }
  
  return 'general';
}

function extractEntities(content: string): string[] {
  // Simple entity extraction - in production, use NER
  const entities: string[] = [];
  
  // Extract capitalized words (potential proper nouns)
  const words = content.split(/\s+/);
  const capitalizedWords = words.filter(word => 
    word.length > 2 && 
    word[0] === word[0].toUpperCase() && 
    word[0].match(/[A-Z]/)
  );
  
  // Get unique entities
  const uniqueEntities = [...new Set(capitalizedWords)].slice(0, 3);
  entities.push(...uniqueEntities);
  
  return entities;
}

function calculateRelevanceScore(content: string, watchlist: any[]): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  watchlist.forEach(item => {
    const weight = item.weight || 1;
    const matches = (content.toLowerCase().match(new RegExp(item.value.toLowerCase(), 'g')) || []).length;
    if (matches > 0) {
      totalScore += weight * Math.min(matches, 3); // Cap at 3 matches
    }
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? Math.min(totalScore / totalWeight, 1) : 0.1;
}

function generateSmartPreview(content: string, indexResult: any, watchlist: any[]): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return content.substring(0, 100) + '...';
  
  // Find the most relevant sentence
  let bestSentence = sentences[0];
  let bestScore = 0;
  
  sentences.forEach(sentence => {
    let score = 0;
    watchlist.forEach(item => {
      if (sentence.toLowerCase().includes(item.value.toLowerCase())) {
        score += item.weight || 1;
      }
    });
    
    // Boost score for sentences containing key concepts
    indexResult.keyConcepts.forEach((concept: string) => {
      if (sentence.toLowerCase().includes(concept.toLowerCase())) {
        score += 0.5;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  });
  
  return bestSentence.trim().substring(0, 120) + (bestSentence.length > 120 ? '...' : '');
}

function generateRefinedSummary(content: string, previewResult: string, indexResult: any, watchlist: any[]): string {
  const relevanceReason = indexResult.relevance === 'high' 
    ? `matches your interests in ${watchlist.map(w => w.value).slice(0, 2).join(', ')}`
    : `relates to ${indexResult.mainTopic}`;
  
  const summary = previewResult.substring(0, 60) + (previewResult.length > 60 ? '...' : '');
  
  return `TL;DR: ${summary} (Relevant because: ${relevanceReason})`;
}

function generateDigestSummary(highlights: DigestItem[], totalItems: number): string {
  if (highlights.length === 0) {
    return 'No new cherries found in your watchlist since your last visit.';
  }
  
  const categories = [...new Set(highlights.map(h => h.category))];
  const topCategory = categories[0];
  
  return `Found ${highlights.length} highlights from ${totalItems} total items. Top category: ${topCategory}. Most relevant: "${highlights[0]?.title}".`;
}

async function cacheDigest(userId: string, sliceKey: string, digest: DigestResult) {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  await supabase
    .from('digest_cache')
    .upsert({
      user_id: userId,
      time_slice_key: sliceKey,
      summary_json: digest,
      expires_at: expiresAt.toISOString()
    });
}
