// Comprehensive RLS diagnostic script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseRLS() {
  console.log('🔍 Comprehensive RLS Diagnostic...\n');
  
  try {
    // 1. Check if we can connect at all
    console.log('1️⃣ Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('cherries')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Basic connection failed:', testError.message);
      return;
    }
    console.log('✅ Basic connection works');
    
    // 2. Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'cherries' });
    
    if (tableError) {
      console.log('ℹ️  Could not get table info directly, but this is normal');
    } else {
      console.log('✅ Table info:', tableInfo);
    }
    
    // 3. Try a simple insert to see the exact error
    console.log('\n3️⃣ Testing simple insert...');
    const { data: insertData, error: insertError } = await supabase
      .from('cherries')
      .insert([
        {
          title: 'Test Cherry',
          content: 'Test content',
          tags: ['test'],
          author_id: '76873831-f3e1-4dd2-a367-cf6e9363f1ce',
          simulated_activity: true,
        }
      ])
      .select();
    
    if (insertError) {
      console.log('❌ Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert worked! Data:', insertData);
    }
    
    // 4. Check if the user exists
    console.log('\n4️⃣ Checking if user exists...');
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', '76873831-f3e1-4dd2-a367-cf6e9363f1ce')
      .single();
    
    if (userError) {
      console.log('❌ User not found:', userError.message);
    } else {
      console.log('✅ User found:', userData);
    }
    
    // 5. Check current cherries
    console.log('\n5️⃣ Checking current cherries...');
    const { data: cherries, error: cherriesError } = await supabase
      .from('cherries')
      .select('id, title, author_id, created_at')
      .limit(5);
    
    if (cherriesError) {
      console.log('❌ Could not fetch cherries:', cherriesError.message);
    } else {
      console.log(`✅ Found ${cherries.length} cherries:`, cherries);
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

diagnoseRLS();
