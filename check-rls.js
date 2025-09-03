// Check RLS status and provide disable solution
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('🔍 Checking RLS status...\n');
  
  try {
    // Check RLS status for our tables
    const { data: rlsStatus, error } = await supabase
      .rpc('check_rls_status', {
        table_names: ['cherries', 'enhanced_comments', 'user_reactions']
      });
    
    if (error) {
      console.log('❌ Could not check RLS status directly');
      console.log('📋 Here are the SQL commands to run in Supabase SQL Editor:\n');
      
      console.log('-- Check current RLS status:');
      console.log(`
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cherries', 'enhanced_comments', 'user_reactions');
      `);
      
      console.log('\n-- Disable RLS (run this first):');
      console.log(`
ALTER TABLE cherries DISABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_reactions DISABLE ROW LEVEL SECURITY;
      `);
      
      console.log('\n-- Verify RLS is disabled:');
      console.log(`
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('cherries', 'enhanced_comments', 'user_reactions');
      `);
      
      console.log('\n-- After simulation, re-enable RLS:');
      console.log(`
ALTER TABLE cherries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;
      `);
    } else {
      console.log('✅ RLS Status:', rlsStatus);
    }
    
  } catch (error) {
    console.error('❌ Error checking RLS:', error);
  }
}

checkRLS();
