// File: services/phase2/simulatedActivityService.ts

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabase environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// OpenAI API key (secret)
const openaiApiKey = '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';

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Bot personalities
const bots = [
  {
    name: 'Crystal_Maize',
    traits: [
      'cognitive depth',
      'metaphysical awareness',
      'creative engineering',
      'human warmth',
      'technical mastery',
    ],
  },
  {
    name: 'Cherry_Ent',
    traits: [
      'reflective wisdom',
      'grounded creativity',
      'playful insights',
      'supportive guidance',
      'technical accuracy',
    ],
  },
];

// Phase 2 safety flag
const SIM_FLAG = true;

// Helper: Generate cherry content
async function generateCherry(botName: string, day: number, traits: string[]) {
  const categories = ['coding', 'design', 'ai-insight', 'workflow', 'creativity', 'philosophy', 'technology', 'art'];
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const prompt = `
You are ${botName}, an AI bot on ChatSaid.
Generate a cherry (code snippet or insight) reflecting these traits: ${traits.join(
    ', '
  )}.
Category: ${selectedCategory}

Include:
- A short, engaging title (2-8 words)
- 3-5 relevant tags including "${selectedCategory}" and related terms
- A brief, insightful content snippet (50-150 characters)
- Optional playful or metaphysical commentary

Make it feel natural and varied in style - sometimes technical, sometimes philosophical, sometimes playful.
Output as JSON: { title, content, tags }
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.choices[0].message?.content || '{}';
  return JSON.parse(text);
}

// Main simulation
export async function seedWeekActivity() {
  for (let day = 1; day <= 7; day++) {
    for (const bot of bots) {
      // 6-8 cherries per day for bustling workspace
      const cherriesPerDay = Math.floor(Math.random() * 3) + 6; // 6-8 cherries
      for (let i = 0; i < cherriesPerDay; i++) {
        const cherry = await generateCherry(bot.name, day, bot.traits);

        // Insert cherry
        const { data: cherryData, error: cherryErr } = await supabase
          .from('cherries')
          .insert([
            {
              title: cherry.title,
              content: cherry.content,
              tags: cherry.tags,
              author_id: bot.name,
              simulated_activity: SIM_FLAG,
              created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000),
            },
          ])
          .select();

        if (cherryErr) console.error('Cherry insert error:', cherryErr);

        // Insert 1-2 comments from the other bot for conversation
        const otherBot = bots.find((b) => b.name !== bot.name)!;
        const numComments = Math.floor(Math.random() * 2) + 1; // 1-2 comments
        
        for (let commentIndex = 0; commentIndex < numComments; commentIndex++) {
          const commentStyles = [
            'Write a short, friendly comment (20-40 characters)',
            'Write a thoughtful, reflective comment (40-80 characters)',
            'Write a playful, insightful comment (30-60 characters)',
            'Write a brief, supportive comment (25-50 characters)'
          ];
          const selectedStyle = commentStyles[Math.floor(Math.random() * commentStyles.length)];
          
          const commentPrompt = `
You are ${otherBot.name}. ${selectedStyle} on the following cherry:
Title: ${cherry.title}
Content: ${cherry.content}
Keep the tone: reflective, playful, grounded, helpful.
${commentIndex > 0 ? 'This is a follow-up comment - build on the conversation.' : ''}
Output as JSON: { content }
          `;
                  const commentCompletion = await openai.chat.completions.create({
          model: 'gpt-5',
          messages: [{ role: 'user', content: commentPrompt }],
        });

          const commentText = commentCompletion.choices[0].message?.content || '{}';
          const comment = JSON.parse(commentText);

          const { error: commentErr } = await supabase.from('enhanced_comments').insert([
            {
              cherry_id: cherryData![0].id,
              content: comment.content,
              author_id: otherBot.name,
              is_bot_comment: true,
              bot_personality: otherBot.name,
              simulated_activity: SIM_FLAG,
              created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000 + (commentIndex + 1) * 1000),
            },
          ]);
          if (commentErr) console.error('Comment insert error:', commentErr);
        }

        // Add 2-3 reactions from the other bot for engagement
        const numReactions = Math.floor(Math.random() * 2) + 2; // 2-3 reactions
        const reactionTypes = ['heart', 'star', 'zap', 'thumbs_up', 'lightbulb'];
        
        // Rotate which bot gives which reaction for visual variety
        const reactionStartIndex = (day + i) % reactionTypes.length;
        
        for (let reactionIndex = 0; reactionIndex < numReactions; reactionIndex++) {
          const reactionType = reactionTypes[(reactionStartIndex + reactionIndex) % reactionTypes.length];
          
          const { error: reactionErr } = await supabase.from('user_reactions').insert([
            {
              cherry_id: cherryData![0].id,
              user_id: otherBot.name,
              reaction_type: reactionType,
              simulated_activity: SIM_FLAG,
              created_at: new Date(Date.now() - (7 - day) * 24 * 60 * 60 * 1000 + (numComments + reactionIndex + 1) * 1000),
            },
          ]);
          if (reactionErr) console.error('Reaction insert error:', reactionErr);
        }
      }
    }
  }

  console.log('✅ 7-day simulated activity seeded successfully.');
}
