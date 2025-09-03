require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleDatabaseCheck() {
  console.log('🔍 Simple Database Check for Phase 2 Tables...\n');

  try {
    // Check Phase 2 tables
    console.log('📊 Phase 2 Table Status:');
    
    const tables = [
      'bot_settings',
      'bot_activity_log', 
      'bot_follows',
      'bot_profiles'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Check table structure
    console.log('\n🔍 Table Structure Check:');
    
    // Try to get a sample record to check columns
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ bot_settings structure: ${error.message}`);
      } else {
        console.log(`✅ bot_settings: Can query successfully`);
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ bot_settings structure error: ${err.message}`);
    }

    // Check cherries table for simulated content
    console.log('\n🍒 Cherries with Simulated Activity:');
    try {
      const { data, error } = await supabase
        .from('cherries')
        .select('id, title, author_id, simulated_activity, created_at')
        .eq('simulated_activity', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`❌ Cherries query: ${error.message}`);
      } else {
        console.log(`📊 Found ${data.length} simulated cherries`);
        data.forEach(cherry => {
          console.log(`   - ${cherry.title} (${new Date(cherry.created_at).toLocaleDateString()})`);
        });
      }
    } catch (err) {
      console.log(`❌ Cherries query error: ${err.message}`);
    }

    // Check comments with simulated activity
    console.log('\n💬 Comments with Simulated Activity:');
    try {
      const { data, error } = await supabase
        .from('enhanced_comments')
        .select('id, content, author_id, simulated_activity, created_at')
        .eq('simulated_activity', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`❌ Comments query: ${error.message}`);
      } else {
        console.log(`📊 Found ${data.length} simulated comments`);
        data.forEach(comment => {
          const content = comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content;
          console.log(`   - ${content} (${new Date(comment.created_at).toLocaleDateString()})`);
        });
      }
    } catch (err) {
      console.log(`❌ Comments query error: ${err.message}`);
    }

    // Check reactions with simulated activity
    console.log('\n❤️ Reactions with Simulated Activity:');
    try {
      const { data, error } = await supabase
        .from('user_reactions')
        .select('id, reaction_type, user_id, simulated_activity, created_at')
        .eq('simulated_activity', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`❌ Reactions query: ${error.message}`);
      } else {
        console.log(`📊 Found ${data.length} simulated reactions`);
        data.forEach(reaction => {
          console.log(`   - ${reaction.reaction_type} (${new Date(reaction.created_at).toLocaleDateString()})`);
        });
      }
    } catch (err) {
      console.log(`❌ Reactions query error: ${err.message}`);
    }

    console.log('\n✅ Simple Database Check Complete!');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

simpleDatabaseCheck();
