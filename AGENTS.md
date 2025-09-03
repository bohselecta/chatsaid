# ChatSaid Agent Layer

## Overview

The ChatSaid Agent Layer implements persona-based AI assistants that can scan user timelines, create delta-digests, and ping other personas for TL;DRs. This system provides intelligent content discovery and personalized recommendations based on user watchlists and preferences.

## Features

### 🤖 Persona Agents
- **Personal AI Companions**: Each user has a unique persona with customizable behavior
- **Autonomy Controls**: Configurable settings for pings, auto-replies, and token budgets
- **Trust Networks**: Trusted persona relationships for enhanced content discovery

### 🍒 Cherry Generation
- **User-Centric Content Creation**: Bot acts as personal algorithm, generating content based on explicit user intent
- **Intent-Based Generation**: Prompts, moods, and style seeds drive personalized cherry suggestions
- **Human Control**: Nothing posts automatically - users decide what to keep, edit, or discard
- **Provenance Tracking**: Full transparency with confidence scores and generation reasoning
- **Smart Filtering**: Uses existing scoring system to rank suggestions by relevance and affinity

### 📊 Sleep Delta Digest
- **Intelligent Scanning**: AI-powered content discovery based on user watchlists
- **Scoring System**: Transparent, configurable scoring with recency, relevance, affinity, novelty, and provenance
- **Caching**: 15-minute cache for performance optimization
- **TL;DR Generation**: AI-generated summaries for top content

### 🔔 Ping Protocol
- **Agent-to-Agent Communication**: Personas can request summaries from each other
- **Rate Limiting**: Built-in protection against spam (5 pings/hour, 20/day)
- **Auto-Reply**: Configurable automatic acknowledgments
- **Audit Trail**: Complete logging of all agent actions

### 📋 Watchlist Management
- **Multi-Type Tracking**: Tags, categories, people, and keywords
- **Weighted Interests**: Configurable importance levels for different items
- **Real-Time Updates**: Dynamic watchlist management

## Architecture

### Database Schema

```sql
-- Core tables
personas (id, user_id, display_name, autonomy_flags, last_active)
watchlists (id, user_id, kind, value, weight)
digest_cache (id, user_id, time_slice_key, summary_json, expires_at)
pings (id, from_persona_id, to_persona_id, status, response)
user_cherry_buckets (id, user_id, cherry_id, category, cherry_text, provenance, source)
bot_cherry_suggestions (id, user_id, prompt, mood, style_seed, cherry_text, provenance, score, status)
agent_actions (id, persona_id, action_type, metadata)
```

### API Endpoints

- `POST /api/agent/digest` - Generate personalized digest
- `GET /api/agent/digest/:id` - Retrieve cached digest
- `POST /api/agent/ping` - Send ping to another persona
- `GET /api/agent/ping` - Retrieve ping history
- `PUT /api/agent/ping` - Reply to or manage pings
- `POST /api/agent/cherries` - Generate cherry suggestions
- `GET /api/agent/cherries` - Retrieve cherry suggestions
- `PUT /api/agent/cherries` - Update cherry status (select/discard/edit)
- `GET /api/watchlists` - Get user watchlists
- `POST /api/watchlists` - Add/remove/update watchlist items
- `GET /api/persona/settings` - Get persona configuration
- `PUT /api/persona/settings` - Update persona settings

### Scoring Algorithm

```javascript
const WEIGHTS = {
  recency: 0.35,    // How recent the content is
  relevance: 0.30,  // Match with watchlist items
  affinity: 0.15,   // Relationship to user (own/friend/public)
  novelty: 0.10,    // Whether content is new to user
  provenance: 0.10  // Source trust level
};
```

## Installation & Setup

### 1. Database Migration

Run the agent system migration:

```bash
# Apply the migration
psql -d your_database -f supabase/migrations/20250115000003_agent_system.sql
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis for caching (optional - falls back to DB if not available)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Background worker configuration
WORKER_CONCURRENCY=3
WORKER_POLL_INTERVAL=5000
```

### 3. Frontend Integration

Add the agent components to your app:

```tsx
import AgentWakeButton from './components/phase2/AgentWakeButton';
import DigestOverlay from './components/phase2/DigestOverlay';
import BotControlPanel from './components/phase2/BotControlPanel';

// In your main component
const [digest, setDigest] = useState(null);
const [showDigest, setShowDigest] = useState(false);

<AgentWakeButton 
  userId={userId}
  onDigestReady={(digest) => {
    setDigest(digest);
    setShowDigest(true);
  }}
/>

<DigestOverlay
  digest={digest}
  isOpen={showDigest}
  onClose={() => setShowDigest(false)}
  onAction={(action, item) => handleDigestAction(action, item)}
/>
```

## Usage Examples

### Basic Digest Generation

```javascript
// Generate digest for user
const response = await fetch('/api/agent/digest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Optional: specify time window
    windowStart: '2025-01-15T00:00:00Z',
    windowEnd: '2025-01-15T23:59:59Z'
  })
});

const { digest } = await response.json();
// digest.highlights contains scored and ranked content
```

### Adding to Watchlist

```javascript
// Add tag to watchlist
await fetch('/api/watchlists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    kind: 'tag',
    value: 'machine-learning',
    weight: 1.5
  })
});
```

### Sending a Ping

```javascript
// Send ping to another persona
await fetch('/api/agent/ping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromPersonaId: 'your-persona-id',
    toPersonaId: 'target-persona-id',
    threadId: 'optional-thread-id',
    maxWords: 200,
    scope: 'public'
  })
});
```

### Generating Cherry Suggestions

```javascript
// Generate cherry suggestions
const response = await fetch('/api/agent/cherries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'What if we could rethink social media?',
    mood: 'inspirational',
    style_seed: 'Previous cherry text for style reference...'
  })
});

const { cherries } = await response.json();
// cherries contains array of generated suggestions with scores
```

### Managing Cherry Suggestions

```javascript
// Select a cherry (adds to user_cherry_buckets)
await fetch('/api/agent/cherries', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'cherry-suggestion-id',
    status: 'selected'
  })
});

// Edit a cherry before selecting
await fetch('/api/agent/cherries', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'cherry-suggestion-id',
    status: 'edited',
    cherry_text: 'Your edited version of the cherry text'
  })
});

// Discard a cherry
await fetch('/api/agent/cherries', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'cherry-suggestion-id',
    status: 'discarded'
  })
});
```

## Configuration

### Persona Autonomy Flags

```javascript
{
  pingsAllowed: true,           // Accept pings from other personas
  autoAck: false,               // Auto-reply to pings
  dailyTokenBudget: 1000,       // Max tokens per day
  quietHours: [22, 8],          // [start_hour, end_hour]
  trustedPersonas: [],          // Array of trusted persona IDs
  autoLearnTags: 'ask'          // 'never' | 'ask' | 'auto-after-3-pins'
}
```

### Watchlist Types

- `tag`: Track specific tags (e.g., "machine-learning")
- `category`: Track categories (e.g., "technical")
- `person`: Track specific users (e.g., user ID)
- `keyword`: Track keywords in content (e.g., "AI research")

## Security & Privacy

### Guardrails

- **Rate Limiting**: Built-in protection against spam and abuse
- **Privacy Controls**: Users control what their persona can access
- **Audit Logging**: All agent actions are logged for transparency
- **Data Retention**: Digest cache expires after 15 minutes, pings after 24 hours

### Privacy Settings

- Users can disable pings entirely
- Content visibility respects existing privacy settings
- No raw content is shared in pings - only TL;DR summaries
- Trust networks are user-controlled

## Performance

### Caching Strategy

- **Redis Cache**: Primary cache for digests, watchlists, and personas
- **Database Fallback**: Automatic fallback to database if Redis unavailable
- **Multi-layer Caching**: Redis → Database → Computation
- **Cache Invalidation**: Smart invalidation on data updates
- **Background Processing**: Heavy operations run asynchronously

### Background Worker System

- **Job Queue**: Redis-based priority queue for background tasks
- **Concurrent Workers**: Configurable number of worker processes
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Types**: Digest generation, ping processing, LLM summarization
- **Health Monitoring**: Built-in health checks and monitoring

### Optimization Tips

1. **Watchlist Size**: Keep watchlists focused (10-20 items max)
2. **Token Budget**: Set reasonable daily limits
3. **Quiet Hours**: Configure to reduce unnecessary processing
4. **Cache Warming**: Pre-compute digests for active users
5. **Redis Configuration**: Use Redis for better performance
6. **Worker Scaling**: Adjust worker concurrency based on load

## Monitoring & Analytics

### Key Metrics

- Digest generation time
- Ping success rates
- Watchlist match accuracy
- User engagement with digests
- Cache hit rates
- Background job processing time
- Worker health status

### Health Monitoring

Check system health via the health endpoint:

```bash
curl http://localhost:3000/api/agent/health
```

Response includes:
- Cache service status
- Background worker status
- Redis connection health
- Worker process count

### Logging

All agent actions are logged in the `agent_actions` table:

```sql
SELECT action_type, COUNT(*) 
FROM agent_actions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type;
```

## Troubleshooting

### Common Issues

1. **Slow Digest Generation**
   - Check watchlist size and complexity
   - Verify database indexes are in place
   - Consider reducing token budget

2. **Ping Failures**
   - Verify target persona exists and allows pings
   - Check rate limits
   - Ensure proper authentication

3. **Cache Issues**
   - Verify Redis connection (if using)
   - Check cache expiration settings
   - Monitor cache hit rates
   - Check Redis memory usage
   - Verify cache invalidation logic

4. **Background Worker Issues**
   - Check worker process status
   - Monitor job queue length
   - Verify job retry logic
   - Check worker health endpoint

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=chatsaid:agent:*
```

## Future Enhancements

- **Machine Learning**: Improve scoring with user feedback
- **Advanced Filtering**: More sophisticated content filtering
- **Collaborative Filtering**: Persona-to-persona recommendations
- **Real-time Updates**: WebSocket-based live digest updates
- **Mobile Optimization**: Enhanced mobile experience

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the audit logs in `agent_actions` table
3. Monitor database performance and query times
4. Verify all environment variables are set correctly

## License

This agent system is part of the ChatSaid project and follows the same licensing terms.