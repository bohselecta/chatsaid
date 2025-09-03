require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabasePerformance() {
  console.log('🔍 Checking Database Performance for Phase 2 Tables...\n');

  try {
    // Check if Phase 2 tables exist
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

    console.log('\n📈 Table Row Counts:');
    
    // Count rows in each table
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`📊 ${table}: ${count || 0} rows`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Check indexes
    console.log('\n🔍 Checking Indexes:');
    const indexQueries = [
      'SELECT indexname, tablename FROM pg_indexes WHERE tablename IN (\'bot_settings\', \'bot_activity_log\', \'bot_follows\', \'bot_profiles\')',
      'SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN (\'bot_settings\', \'bot_activity_log\', \'bot_follows\', \'bot_profiles\')'
    ];

    for (const query of indexQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`❌ Query failed: ${error.message}`);
        } else {
          console.log(`✅ Query executed successfully`);
          if (data && data.length > 0) {
            data.forEach(row => {
              console.log(`   ${JSON.stringify(row)}`);
            });
          }
        }
      } catch (err) {
        console.log(`❌ Query error: ${err.message}`);
      }
    }

    // Check RLS policies
    console.log('\n🔒 RLS Policy Status:');
    const rlsQuery = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename IN ('bot_settings', 'bot_activity_log', 'bot_follows', 'bot_profiles')
      ORDER BY tablename, policyname
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: rlsQuery });
      if (error) {
        console.log(`❌ RLS query failed: ${error.message}`);
      } else {
        if (data && data.length > 0) {
          data.forEach(policy => {
            console.log(`✅ ${policy.tablename}.${policy.policyname}: ${policy.cmd}`);
          });
        } else {
          console.log('⚠️ No RLS policies found for Phase 2 tables');
        }
      }
    } catch (err) {
      console.log(`❌ RLS query error: ${err.message}`);
    }

    // Check triggers
    console.log('\n⚡ Trigger Status:');
    const triggerQuery = `
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers 
      WHERE event_object_table IN ('bot_settings', 'bot_activity_log', 'bot_follows', 'bot_profiles')
      ORDER BY event_object_table, trigger_name
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: triggerQuery });
      if (error) {
        console.log(`❌ Trigger query failed: ${error.message}`);
      } else {
        if (data && data.length > 0) {
          data.forEach(trigger => {
            console.log(`✅ ${trigger.event_object_table}.${trigger.trigger_name}: ${trigger.event_manipulation}`);
          });
        } else {
          console.log('⚠️ No triggers found for Phase 2 tables');
        }
      }
    } catch (err) {
      console.log(`❌ Trigger query error: ${err.message}`);
    }

    // Performance test: Insert a test record
    console.log('\n🧪 Performance Test: Insert Test Record');
    try {
      const testUserId = '76873831-f3e1-4dd2-a367-cf6e9363f1ce'; // Your user ID
      
      const { data, error } = await supabase
        .from('bot_settings')
        .insert([{
          user_id: testUserId,
          bot_name: 'Test Bot',
          autonomy_mode: 'suggested',
          action_settings: {
            follow_bots: 'suggested',
            comment_on_cherries: 'automatic',
            react_to_cherries: 'automatic',
            create_cherries: 'suggested',
            explore_content: 'automatic'
          },
          is_active: true
        }])
        .select();

      if (error) {
        console.log(`❌ Insert test failed: ${error.message}`);
      } else {
        console.log(`✅ Test insert successful: ${data[0].id}`);
        
        // Clean up test record
        await supabase
          .from('bot_settings')
          .delete()
          .eq('bot_name', 'Test Bot');
        console.log('🧹 Test record cleaned up');
      }
    } catch (err) {
      console.log(`❌ Performance test error: ${err.message}`);
    }

    console.log('\n✅ Database Performance Check Complete!');

  } catch (error) {
    console.error('❌ Database performance check failed:', error);
  }
}

checkDatabasePerformance();
