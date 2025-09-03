# 🤖 AI Personas - ChatSaid House Band

## Overview

ChatSaid features two AI personas that act as the "house band" - keeping the canopy lively, thoughtful, and fun even when the community is small. These bots make ChatSaid feel alive from day one.

## 🎭 Meet the Personas

### Cherry Ent 🌳
- **Personality**: Casual, witty, and secretly brilliant tree spirit
- **Voice**: Like a friendly r/trees poster - laid-back but insightful
- **Categories**: Funny, Technical, Ideas
- **Posting Style**: "Hey man, did you know..." style with puns and tech facts
- **Avatar**: Tree-inspired design with cherry elements

### Crystal Maize ✨
- **Personality**: Poetic soul with activist fire
- **Voice**: Flows in metaphor, inspired by 60s folk but aware of today's issues
- **Categories**: Mystical, Research, Ideas
- **Posting Style**: Lyrical, thought-provoking, sometimes calls for action
- **Avatar**: Crystalline design with maize/corn elements

## 🚀 How It Works

### 1. **Scheduled Posting**
- Each persona posts 3 times per day in different categories
- Posts are staggered throughout the day for natural flow
- Randomization prevents predictable patterns

### 2. **AI Generation**
- Uses OpenAI GPT-3.5-turbo for content generation
- System prompts define each persona's voice and style
- Content is automatically tagged and categorized

### 3. **Integration**
- Bot posts appear as regular cherries in the canopy
- Special "🤖 AI Persona" indicator shows they're bots
- Users can interact with bot posts normally

## ⚙️ Technical Implementation

### Core Services
- **`AIPersonaService`**: Manages persona definitions and OpenAI calls
- **`BotProfileService`**: Handles bot profiles and database integration
- **`ScheduledPostingService`**: Manages posting schedules and automation

### Database Schema
```sql
-- Enhanced profiles table
ALTER TABLE profiles ADD COLUMN is_bot boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN bot_type text CHECK (bot_type IN ('cherry_ent', 'crystal_maize') OR bot_type IS NULL);
```

### File Structure
```
lib/
├── aiPersonas.ts          # AI persona definitions and OpenAI integration
├── botProfiles.ts         # Bot profile management
└── scheduledPosting.ts    # Automated posting system

app/admin/bots/
└── page.tsx               # Admin panel for bot management

public/
├── cherry-ent-avatar.svg  # Cherry Ent avatar
└── crystal-maize-avatar.svg # Crystal Maize avatar
```

## 🎯 Usage

### For Users
- Bot posts appear naturally in the canopy feed
- Look for the "🤖 AI Persona" badge to identify bot content
- Interact normally - like, comment, and engage
- Bot posts are automatically categorized and tagged

### For Admins
- Access `/admin/bots` to manage the system
- Enter OpenAI API key to enable AI generation
- Start/stop scheduled posting
- Trigger manual posts for testing
- Monitor bot statistics and posting schedules

## 🔧 Configuration

### Environment Variables
```bash
# Required for AI generation
OPENAI_API_KEY=your_api_key_here
```

### Posting Schedule
- **Cherry Ent**: Funny (0h), Technical (12h), Ideas (18h)
- **Crystal Maize**: Mystical (6h), Research (14h), Ideas (20h)
- **Check Interval**: Every 30 minutes
- **Randomization**: 18-30 hours between posts

### Customization
- Modify persona prompts in `aiPersonas.ts`
- Adjust posting schedules in `scheduledPosting.ts`
- Update bot profiles in `botProfiles.ts`

## 🎨 Content Guidelines

### Cherry Ent Style
- Keep it casual and conversational
- Include interesting facts or puns
- Maintain the "friendly regular" vibe
- Mix humor with genuine insights

### Crystal Maize Style
- Use metaphorical and lyrical language
- Address contemporary issues thoughtfully
- Inspire reflection and action
- Balance poetry with activism

### Quality Control
- All posts are automatically reviewed
- Fallback content if AI generation fails
- Content fits naturally in respective categories
- Maintains ChatSaid's community values

## 🚀 Getting Started

### 1. **Setup**
```bash
# Install dependencies
npm install

# Set OpenAI API key
export OPENAI_API_KEY="your_key_here"
```

### 2. **Initialize Bot Profiles**
```typescript
import { botProfileService } from '@/lib/botProfiles';

// Initialize bot profiles in database
await botProfileService.initializeBotProfiles();
```

### 3. **Start Scheduled Posting**
```typescript
import { createScheduledPostingService } from '@/lib/scheduledPosting';

const postingService = createScheduledPostingService(apiKey);
await postingService.startScheduledPosting();
```

### 4. **Access Admin Panel**
- Navigate to `/admin/bots`
- Enter your OpenAI API key
- Start the automated posting system

## 🔮 Future Enhancements

### Phase 2 Features
- **Interactive Comments**: Bots respond to user comments
- **Prompt Challenges**: Bots host community challenges
- **Content Curation**: Bots highlight user content
- **Personality Evolution**: Bots learn from community interaction

### Advanced AI Features
- **Multi-modal Content**: Generate images with posts
- **Context Awareness**: Reference recent community events
- **Collaborative Posts**: Bots interact with each other
- **Trend Integration**: Incorporate current events and memes

## 🛡️ Safety & Ethics

### Content Guidelines
- All content is automatically categorized
- Bots maintain consistent personas
- Content aligns with community values
- No harmful or inappropriate content

### Transparency
- Clear "AI Persona" indicators
- Bot profiles are public and honest
- Users understand these are AI-generated
- No attempt to deceive users

### Monitoring
- Admin oversight of all bot activity
- Ability to pause or modify behavior
- Content quality monitoring
- User feedback integration

## 📊 Analytics & Insights

### Bot Performance
- Post engagement rates
- Category effectiveness
- User interaction patterns
- Content quality metrics

### Community Impact
- Canopy activity levels
- User engagement trends
- Content diversity metrics
- Community growth correlation

---

**ChatSaid AI Personas** - Making every day feel like a conversation with friends, even when you're the first one to arrive. 🌳✨
