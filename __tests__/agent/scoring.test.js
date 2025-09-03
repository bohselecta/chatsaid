/**
 * Unit tests for ChatSaid Agent scoring system
 */

// Mock scoring function (extracted from digest route for testing)
function calculateScore(cherry, watchlist, persona) {
  const WEIGHTS = {
    recency: 0.35,
    relevance: 0.30,
    affinity: 0.15,
    novelty: 0.10,
    provenance: 0.10
  };

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

function calculateRelevance(cherry, watchlist) {
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

function calculateAffinity(cherry, persona) {
  // Simplified affinity calculation
  if (cherry.author_id === persona?.user_id) return 1.0; // Own content
  if (cherry.visibility === 'friends') return 0.8; // Friend content
  if (cherry.visibility === 'public') return 0.5; // Public content
  return 0.2; // Default
}

function calculateProvenanceScore(cherry) {
  // Higher score for more trusted sources
  switch (cherry.visibility) {
    case 'private': return 1.0;
    case 'friends': return 0.8;
    case 'public': return 0.6;
    default: return 0.5;
  }
}

describe('Agent Scoring System', () => {
  const mockPersona = {
    user_id: 'user-123',
    autonomy_flags: { pingsAllowed: true }
  };

  const mockWatchlist = [
    { kind: 'tag', value: 'ai', weight: 1.5 },
    { kind: 'category', value: 'technical', weight: 1.0 },
    { kind: 'person', value: 'user-456', weight: 2.0 }
  ];

  describe('calculateScore', () => {
    it('should rank recency and relevance highly', () => {
      const recentCherry = {
        id: '1',
        title: 'AI Research',
        content: 'Latest AI developments',
        author_id: 'user-456',
        created_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        tags: ['ai', 'research'],
        category: 'technical',
        visibility: 'public'
      };

      const oldCherry = {
        id: '2',
        title: 'Old Post',
        content: 'Some old content',
        author_id: 'user-789',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        tags: ['ai'],
        category: 'technical',
        visibility: 'public'
      };

      const recentScore = calculateScore(recentCherry, mockWatchlist, mockPersona);
      const oldScore = calculateScore(oldCherry, mockWatchlist, mockPersona);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('should prioritize content from watched users', () => {
      const watchedUserCherry = {
        id: '1',
        title: 'From Watched User',
        content: 'Content from someone I follow',
        author_id: 'user-456', // In watchlist
        created_at: new Date(Date.now() - 1000).toISOString(),
        tags: [],
        category: 'funny',
        visibility: 'public'
      };

      const randomUserCherry = {
        id: '2',
        title: 'From Random User',
        content: 'Content from someone random',
        author_id: 'user-999', // Not in watchlist
        created_at: new Date(Date.now() - 1000).toISOString(),
        tags: [],
        category: 'funny',
        visibility: 'public'
      };

      const watchedScore = calculateScore(watchedUserCherry, mockWatchlist, mockPersona);
      const randomScore = calculateScore(randomUserCherry, mockWatchlist, mockPersona);

      expect(watchedScore).toBeGreaterThan(randomScore);
    });

    it('should score own content highest', () => {
      const ownCherry = {
        id: '1',
        title: 'My Own Post',
        content: 'My own content',
        author_id: 'user-123', // Same as persona user_id
        created_at: new Date(Date.now() - 1000).toISOString(),
        tags: [],
        category: 'funny',
        visibility: 'private'
      };

      const otherCherry = {
        id: '2',
        title: 'Someone Else Post',
        content: 'Someone else content',
        author_id: 'user-456',
        created_at: new Date(Date.now() - 1000).toISOString(),
        tags: ['ai'],
        category: 'technical',
        visibility: 'public'
      };

      const ownScore = calculateScore(ownCherry, mockWatchlist, mockPersona);
      const otherScore = calculateScore(otherCherry, mockWatchlist, mockPersona);

      expect(ownScore).toBeGreaterThan(otherScore);
    });

    it('should handle empty watchlist gracefully', () => {
      const cherry = {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        author_id: 'user-456',
        created_at: new Date(Date.now() - 1000).toISOString(),
        tags: ['ai'],
        category: 'technical',
        visibility: 'public'
      };

      const score = calculateScore(cherry, [], mockPersona);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateRelevance', () => {
    it('should match tags correctly', () => {
      const cherry = {
        tags: ['ai', 'machine-learning'],
        category: 'technical',
        title: 'AI Research',
        content: 'Machine learning content'
      };

      const watchlist = [
        { kind: 'tag', value: 'ai', weight: 1.0 },
        { kind: 'tag', value: 'python', weight: 1.0 }
      ];

      const relevance = calculateRelevance(cherry, watchlist);
      expect(relevance).toBeGreaterThan(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    it('should match categories correctly', () => {
      const cherry = {
        tags: [],
        category: 'technical',
        title: 'Tech Post',
        content: 'Technical content'
      };

      const watchlist = [
        { kind: 'category', value: 'technical', weight: 1.0 }
      ];

      const relevance = calculateRelevance(cherry, watchlist);
      expect(relevance).toBe(1.0);
    });

    it('should match keywords in title and content', () => {
      const cherry = {
        tags: [],
        category: 'funny',
        title: 'AI Research Breakthrough',
        content: 'This is about artificial intelligence'
      };

      const watchlist = [
        { kind: 'keyword', value: 'ai', weight: 1.0 },
        { kind: 'keyword', value: 'research', weight: 1.0 }
      ];

      const relevance = calculateRelevance(cherry, watchlist);
      expect(relevance).toBeGreaterThan(0);
    });
  });

  describe('calculateAffinity', () => {
    it('should give highest affinity to own content', () => {
      const cherry = {
        author_id: 'user-123',
        visibility: 'private'
      };

      const affinity = calculateAffinity(cherry, mockPersona);
      expect(affinity).toBe(1.0);
    });

    it('should give higher affinity to friends content', () => {
      const cherry = {
        author_id: 'user-456',
        visibility: 'friends'
      };

      const affinity = calculateAffinity(cherry, mockPersona);
      expect(affinity).toBe(0.8);
    });

    it('should give medium affinity to public content', () => {
      const cherry = {
        author_id: 'user-456',
        visibility: 'public'
      };

      const affinity = calculateAffinity(cherry, mockPersona);
      expect(affinity).toBe(0.5);
    });
  });

  describe('calculateProvenanceScore', () => {
    it('should score private content highest', () => {
      const cherry = { visibility: 'private' };
      const score = calculateProvenanceScore(cherry);
      expect(score).toBe(1.0);
    });

    it('should score friends content higher than public', () => {
      const friendsCherry = { visibility: 'friends' };
      const publicCherry = { visibility: 'public' };

      const friendsScore = calculateProvenanceScore(friendsCherry);
      const publicScore = calculateProvenanceScore(publicCherry);

      expect(friendsScore).toBeGreaterThan(publicScore);
    });

    it('should handle unknown visibility', () => {
      const cherry = { visibility: 'unknown' };
      const score = calculateProvenanceScore(cherry);
      expect(score).toBe(0.5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing tags gracefully', () => {
      const cherry = {
        id: '1',
        title: 'Test',
        content: 'Test content',
        author_id: 'user-456',
        created_at: new Date().toISOString(),
        category: 'technical',
        visibility: 'public'
        // No tags property
      };

      const score = calculateScore(cherry, mockWatchlist, mockPersona);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should handle null persona', () => {
      const cherry = {
        id: '1',
        title: 'Test',
        content: 'Test content',
        author_id: 'user-456',
        created_at: new Date().toISOString(),
        tags: ['ai'],
        category: 'technical',
        visibility: 'public'
      };

      const score = calculateScore(cherry, mockWatchlist, null);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should handle very old content', () => {
      const cherry = {
        id: '1',
        title: 'Very Old Post',
        content: 'Very old content',
        author_id: 'user-456',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
        tags: ['ai'],
        category: 'technical',
        visibility: 'public'
      };

      const score = calculateScore(cherry, mockWatchlist, mockPersona);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });
});
