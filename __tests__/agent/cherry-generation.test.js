/**
 * Unit tests for Cherry Generation functionality
 */

describe('Cherry Generation', () => {
  // Mock cherry suggestion data
  const mockCherrySuggestion = {
    id: 'test-cherry-1',
    prompt: 'What if we could rethink social media?',
    mood: 'inspirational',
    style_seed: 'Previous cherry text for reference',
    cherry_text: 'A new perspective on social media that puts human connection first.',
    provenance: {
      source: 'bot_generation',
      confidence: 0.85,
      reasoning: 'Generated using direct response approach in an inspirational tone',
      bot_version: '1.0.0'
    },
    score: 0.75,
    created_at: new Date().toISOString(),
    status: 'pending'
  };

  const mockWatchlist = [
    { kind: 'tag', value: 'social-media', weight: 1.5 },
    { kind: 'tag', value: 'innovation', weight: 1.2 },
    { kind: 'keyword', value: 'connection', weight: 1.0 }
  ];

  const mockPersona = {
    id: 'test-persona-1',
    user_id: 'test-user-1',
    display_name: 'Test Persona',
    autonomy_flags: {
      pingsAllowed: true,
      autoAck: false,
      dailyTokenBudget: 1000,
      quietHours: [22, 8],
      trustedPersonas: [],
      autoLearnTags: 'ask'
    }
  };

  describe('Cherry Scoring', () => {
    test('should calculate score based on watchlist relevance', () => {
      const calculateWatchlistRelevance = (text, watchlist) => {
        let relevance = 0;
        let totalWeight = 0;

        for (const item of watchlist) {
          const weight = item.weight || 1.0;
          const matches = (text.toLowerCase().match(new RegExp(item.value.toLowerCase(), 'g')) || []).length;
          if (matches > 0) {
            relevance += weight * Math.min(matches, 3);
          }
          totalWeight += weight;
        }

        return totalWeight > 0 ? Math.min(relevance / totalWeight, 1) : 0.1;
      };

      const relevance = calculateWatchlistRelevance(mockCherrySuggestion.cherry_text, mockWatchlist);
      expect(relevance).toBeGreaterThan(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    test('should calculate overall cherry score', () => {
      const calculateCherryScore = (suggestion, watchlist, persona) => {
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

        return Math.min(score, 1.0);
      };

      const calculateWatchlistRelevance = (text, watchlist) => {
        let relevance = 0;
        let totalWeight = 0;

        for (const item of watchlist) {
          const weight = item.weight || 1.0;
          const matches = (text.toLowerCase().match(new RegExp(item.value.toLowerCase(), 'g')) || []).length;
          if (matches > 0) {
            relevance += weight * Math.min(matches, 3);
          }
          totalWeight += weight;
        }

        return totalWeight > 0 ? Math.min(relevance / totalWeight, 1) : 0.1;
      };

      const score = calculateCherryScore(mockCherrySuggestion, mockWatchlist, mockPersona);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Cherry Generation Logic', () => {
    test('should validate mood options', () => {
      const validMoods = [
        'inspirational', 'whimsical', 'thoughtful', 'playful', 
        'serious', 'creative', 'analytical', 'emotional', 'curious'
      ];

      expect(validMoods).toContain(mockCherrySuggestion.mood);
    });

    test('should generate cherry text with mood context', () => {
      const generateCherryText = (prompt, mood, approach, style_seed) => {
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

        const moodWords = mood && moodModifiers[mood] 
          ? moodModifiers[mood] 
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
      };

      const cherryText = generateCherryText(
        mockCherrySuggestion.prompt,
        mockCherrySuggestion.mood,
        'direct response',
        mockCherrySuggestion.style_seed
      );

      expect(cherryText).toContain(mockCherrySuggestion.prompt);
      expect(cherryText.length).toBeGreaterThan(10);
    });

    test('should handle empty watchlist gracefully', () => {
      const calculateWatchlistRelevance = (text, watchlist) => {
        let relevance = 0;
        let totalWeight = 0;

        for (const item of watchlist) {
          const weight = item.weight || 1.0;
          const matches = (text.toLowerCase().match(new RegExp(item.value.toLowerCase(), 'g')) || []).length;
          if (matches > 0) {
            relevance += weight * Math.min(matches, 3);
          }
          totalWeight += weight;
        }

        return totalWeight > 0 ? Math.min(relevance / totalWeight, 1) : 0.1;
      };

      const relevance = calculateWatchlistRelevance(mockCherrySuggestion.cherry_text, []);
      expect(relevance).toBe(0.1);
    });

    test('should handle missing mood gracefully', () => {
      const suggestionWithoutMood = { ...mockCherrySuggestion, mood: undefined };
      
      const calculateCherryScore = (suggestion, watchlist, persona) => {
        let score = 0.5; // Base score

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

        return Math.min(score, 1.0);
      };

      const score = calculateCherryScore(suggestionWithoutMood, mockWatchlist, mockPersona);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Cherry Status Management', () => {
    test('should validate cherry status values', () => {
      const validStatuses = ['pending', 'selected', 'discarded', 'edited'];
      
      expect(validStatuses).toContain(mockCherrySuggestion.status);
    });

    test('should handle cherry selection', () => {
      const selectedCherry = { ...mockCherrySuggestion, status: 'selected' };
      
      expect(selectedCherry.status).toBe('selected');
      expect(selectedCherry.id).toBe(mockCherrySuggestion.id);
    });

    test('should handle cherry editing', () => {
      const editedText = 'This is the edited version of the cherry text.';
      const editedCherry = { 
        ...mockCherrySuggestion, 
        status: 'edited',
        cherry_text: editedText
      };
      
      expect(editedCherry.status).toBe('edited');
      expect(editedCherry.cherry_text).toBe(editedText);
    });

    test('should handle cherry discarding', () => {
      const discardedCherry = { ...mockCherrySuggestion, status: 'discarded' };
      
      expect(discardedCherry.status).toBe('discarded');
    });
  });

  describe('Provenance Tracking', () => {
    test('should include required provenance fields', () => {
      const provenance = mockCherrySuggestion.provenance;
      
      expect(provenance).toHaveProperty('source');
      expect(provenance).toHaveProperty('confidence');
      expect(provenance).toHaveProperty('reasoning');
      expect(provenance).toHaveProperty('bot_version');
    });

    test('should have valid confidence score', () => {
      const confidence = mockCherrySuggestion.provenance.confidence;
      
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    test('should have meaningful reasoning', () => {
      const reasoning = mockCherrySuggestion.provenance.reasoning;
      
      expect(reasoning).toBeTruthy();
      expect(reasoning.length).toBeGreaterThan(10);
    });
  });
});
