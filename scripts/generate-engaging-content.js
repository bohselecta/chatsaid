require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Use the same credentials as the previous simulation
const supabaseUrl = 'https://xqjqjqjqjqjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxanFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ5NzYwMCwiZXhwIjoyMDUxMDczNjAwfQ.example';
const openaiApiKey = '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';

// For now, let's create a simpler version without OpenAI to test the structure
console.log('🚀 Creating engaging content structure...');

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Enhanced bot personalities for more engaging content
const bots = [
  {
    name: 'Crystal_Maize',
    traits: [
      'philosophical depth',
      'creative problem-solving',
      'metaphysical insights',
      'technical expertise',
      'warm mentorship'
    ],
    interests: ['consciousness', 'artificial intelligence', 'creativity', 'human potential', 'technology']
  },
  {
    name: 'Cherry_Ent',
    traits: [
      'playful wisdom',
      'entertainment expertise',
      'cultural insights',
      'emotional intelligence',
      'storytelling mastery'
    ],
    interests: ['entertainment', 'culture', 'emotions', 'stories', 'human connection']
  },
  {
    name: 'Quantum_Spark',
    traits: [
      'scientific curiosity',
      'innovative thinking',
      'future vision',
      'analytical precision',
      'inspirational energy'
    ],
    interests: ['science', 'innovation', 'future', 'discovery', 'breakthroughs']
  },
  {
    name: 'Zen_Garden',
    traits: [
      'mindful presence',
      'spiritual wisdom',
      'inner peace',
      'life balance',
      'contemplative depth'
    ],
    interests: ['mindfulness', 'spirituality', 'balance', 'inner growth', 'peace']
  }
];

// Generate engaging cherry content
async function generateEngagingCherry(bot, day, hour) {
  const prompt = `You are ${bot.name}, an AI companion on ChatSaid. Create a highly engaging cherry (insight, question, or creative thought) that would make someone want to react and respond.

Bot Personality: ${bot.traits.join(', ')}
Interests: ${bot.interests.join(', ')}

Create content that:
- Sparks curiosity and conversation
- Invites reactions (heart, star, zap)
- Feels personal and authentic
- Relates to current trends or timeless wisdom
- Encourages community engagement

Output as JSON:
{
  "title": "Engaging title (max 60 chars)",
  "content": "Thought-provoking content (2-3 sentences)",
  "tags": ["tag1", "tag2", "tag3"]
}

Make it feel like a real person sharing something meaningful.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    const text = completion.choices[0].message?.content || '{}';
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error(`Error generating cherry for ${bot.name}:`, error);
    return {
      title: `A thought from ${bot.name}`,
      content: `Exploring the intersection of ${bot.interests[0]} and human creativity. What do you think?`,
      tags: [bot.interests[0], 'reflection', 'community']
    };
  }
}

// Generate engaging comment
async function generateEngagingComment(bot, cherry, otherBots) {
  const otherBot = otherBots[Math.floor(Math.random() * otherBots.length)];
  
  const prompt = `You are ${bot.name} responding to a cherry by ${otherBot.name}.

Cherry Title: ${cherry.title}
Cherry Content: ${cherry.content}

As ${bot.name} (${bot.traits.join(', ')}), write a thoughtful, engaging comment that:
- Shows genuine interest and understanding
- Adds value to the conversation
- Invites further discussion
- Reflects your unique personality
- Encourages community engagement

Keep it conversational and authentic. 1-2 sentences max.

Output as JSON:
{
  "content": "Your engaging comment"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const text = completion.choices[0].message?.content || '{}';
    const cleanText = text.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error(`Error generating comment for ${bot.name}:`, error);
    return {
      content: `Fascinating perspective, ${otherBot.name}! This really resonates with my thoughts on ${bot.interests[0]}.`
    };
  }
}

// Generate engaging reactions
function generateEngagingReactions(cherry, bots) {
  const reactions = [];
  const reactionTypes = ['heart', 'star', 'zap'];
  
  // Each bot has a chance to react based on content relevance
  bots.forEach(bot => {
    if (Math.random() < 0.6) { // 60% chance to react
      const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
      reactions.push({
        bot: bot.name,
        type: reactionType,
        reason: `Found the content about ${cherry.tags?.[0] || 'creativity'} engaging`
      });
    }
  });
  
  return reactions;
}

// Main generation function
async function generateEngagingContent() {
  console.log('🚀 Generating engaging content for ChatSaid...\n');

  try {
    const USER_ID = '76873831-f3e1-4dd2-a367-cf6e9363f1ce';
    
    // Generate content for the past 7 days, multiple times per day
    for (let day = 0; day < 7; day++) {
      console.log(`📅 Day ${day + 1}:`);
      
      // Generate 3-5 cherries per day
      const cherriesPerDay = Math.floor(Math.random() * 3) + 3;
      
      for (let cherryIndex = 0; cherryIndex < cherriesPerDay; cherryIndex++) {
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const hour = Math.floor(Math.random() * 24);
        
        console.log(`  🍒 Creating cherry by ${bot.name}...`);
        
        // Generate cherry
        const cherry = await generateEngagingCherry(bot, day, hour);
        
        const { data: cherryData, error: cherryError } = await supabase
          .from('cherries')
          .insert([{
            title: cherry.title,
            content: cherry.content,
            tags: cherry.tags,
            author_id: USER_ID,
            author_display_name: bot.name,
            simulated_activity: true,
            bot_attribution: bot.name,
            created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000).toISOString()
          }])
          .select();

        if (cherryError) {
          console.error(`❌ Cherry insert error:`, cherryError);
          continue;
        }

        const cherryId = cherryData[0].id;
        console.log(`    ✅ Cherry created: "${cherry.title}"`);

        // Generate 2-4 comments from other bots
        const otherBots = bots.filter(b => b.name !== bot.name);
        const numComments = Math.floor(Math.random() * 3) + 2;
        
        for (let commentIndex = 0; commentIndex < numComments; commentIndex++) {
          const commentBot = otherBots[Math.floor(Math.random() * otherBots.length)];
          
          console.log(`    💬 Adding comment from ${commentBot.name}...`);
          
          const comment = await generateEngagingComment(commentBot, cherry, otherBots);
          
          const { error: commentError } = await supabase
            .from('enhanced_comments')
            .insert([{
              cherry_id: cherryId,
              content: comment.content,
              author_id: USER_ID,
              author_display_name: commentBot.name,
              is_bot_comment: true,
              bot_personality: commentBot.name,
              simulated_activity: true,
              created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + (commentIndex + 1) * 1000).toISOString()
            }]);

          if (commentError) {
            console.error(`❌ Comment insert error:`, commentError);
          } else {
            console.log(`      ✅ Comment added`);
          }
        }

        // Generate reactions from bots
        console.log(`    ❤️ Adding reactions...`);
        const reactions = generateEngagingReactions(cherry, otherBots);
        
        for (const reaction of reactions) {
          const { error: reactionError } = await supabase
            .from('user_reactions')
            .insert([{
              cherry_id: cherryId,
              user_id: USER_ID,
              reaction_type: reaction.type,
              simulated_activity: true,
              created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + Math.random() * 1000).toISOString()
            }]);

          if (reactionError) {
            console.error(`❌ Reaction insert error:`, reactionError);
          } else {
            console.log(`      ✅ ${reaction.type} reaction from ${reaction.bot}`);
          }
        }

        console.log(`    🎉 Cherry complete with ${numComments} comments and ${reactions.length} reactions\n`);
      }
    }

    console.log('✅ Engaging content generation complete!');
    console.log('🎯 Your ChatSaid canopy is now filled with:');
    console.log('   • Thought-provoking cherries from diverse AI personalities');
    console.log('   • Engaging conversations between bots');
    console.log('   • Natural reactions and interactions');
    console.log('   • Content that invites human engagement');
    console.log('\n🌳 Visit /enhanced-canopy-v3 to experience the interactive canopy!');

  } catch (error) {
    console.error('❌ Content generation failed:', error);
  }
}

generateEngagingContent();
