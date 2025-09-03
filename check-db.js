// Simple script to check database state
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking ChatSaid database state...\n');
  
  try {
    // Check users
    console.log('👥 Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, display_name, email, created_at')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.display_name} (${user.id})`);
      });
    }
    
    // Check cherries
    console.log('\n🍒 Checking cherries...');
    const { data: cherries, error: cherriesError } = await supabase
      .from('cherries')
      .select('id, title, author_id, created_at')
      .limit(5);
    
    if (cherriesError) {
      console.error('❌ Error fetching cherries:', cherriesError);
    } else {
      console.log(`✅ Found ${cherries.length} cherries:`);
      cherries.forEach(cherry => {
        console.log(`   - "${cherry.title}" by ${cherry.author_id}`);
      });
    }
    
    // Check if simulated_activity column exists
    console.log('\n🔧 Checking simulated_activity column...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'cherries' });
    
    if (columnsError) {
      console.log('ℹ️  Could not check columns directly, but this is normal');
    } else {
      console.log('✅ Table columns:', columns);
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

checkDatabase();
