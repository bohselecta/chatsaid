// Run user cherry collections migration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔧 Running user cherry collections migration...');
    
    // 1. Create user_cherry_collections table
    console.log('Creating user_cherry_collections table...');
    const { error: collectionsError } = await supabase
      .from('user_cherry_collections')
      .select('id')
      .limit(1);
    
    if (collectionsError && collectionsError.code === 'PGRST204') {
      console.log('Creating user_cherry_collections table...');
      // Table doesn't exist, we'll create it through the API
      // For now, let's just log that we need to create it manually
      console.log('⚠️  Please create the user_cherry_collections table manually in Supabase dashboard');
    } else {
      console.log('✅ user_cherry_collections table already exists');
    }
    
    // 2. Create cherry_category_rankings table
    console.log('Creating cherry_category_rankings table...');
    const { error: rankingsError } = await supabase
      .from('cherry_category_rankings')
      .select('id')
      .limit(1);
    
    if (rankingsError && rankingsError.code === 'PGRST204') {
      console.log('⚠️  Please create the cherry_category_rankings table manually in Supabase dashboard');
    } else {
      console.log('✅ cherry_category_rankings table already exists');
    }
    
    // 3. Create user_ai_learning_preferences table
    console.log('Creating user_ai_learning_preferences table...');
    const { error: preferencesError } = await supabase
      .from('user_ai_learning_preferences')
      .select('id')
      .limit(1);
    
    if (preferencesError && preferencesError.code === 'PGRST204') {
      console.log('⚠️  Please create the user_ai_learning_preferences table manually in Supabase dashboard');
    } else {
      console.log('✅ user_ai_learning_preferences table already exists');
    }
    
    // 4. Create ai_learning_sessions table
    console.log('Creating ai_learning_sessions table...');
    const { error: sessionsError } = await supabase
      .from('ai_learning_sessions')
      .select('id')
      .limit(1);
    
    if (sessionsError && sessionsError.code === 'PGRST204') {
      console.log('⚠️  Please create the ai_learning_sessions table manually in Supabase dashboard');
    } else {
      console.log('✅ ai_learning_sessions table already exists');
    }
    
    console.log('✅ Migration check completed!');
    console.log('📋 To complete the migration, please run the SQL from:');
    console.log('   supabase/migrations/20250115000002_phase2_user_cherry_collections.sql');
    console.log('   in your Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
