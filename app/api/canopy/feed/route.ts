import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use environment variables like the working simulation script
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    console.log("🔍 Fetching cherries from database...");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const pageSize = searchParams.get('pageSize') || '20';
    const sortBy = searchParams.get('sortBy') || 'mixed';
    const contentFilter = searchParams.get('contentFilter') || 'all';

    // Build the query
    let query = supabase
      .from("cherries")
      .select(`
        id,
        title,
        content,
        author_id,
        created_at,
        tags,
        simulated_activity,
        bot_attribution
      `);

    // Apply content filter
    if (contentFilter === 'ai-only') {
      query = query.or('bot_attribution.not.is.null,simulated_activity.eq.true');
    } else if (contentFilter === 'human-only') {
      query = query.and('bot_attribution.is.null,simulated_activity.eq.false');
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === 'popular') {
      // For now, use created_at as proxy for popularity
      // TODO: Implement actual popularity scoring
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === 'bot-focus') {
      query = query.order("bot_attribution", { ascending: false }).order("created_at", { ascending: false });
    } else {
      // Mixed sorting - default
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const offset = pageNum * limit;
    
    query = query.range(offset, offset + limit - 1);

    const { data: cherries, error } = await query;

    if (error) {
      console.error("❌ Database query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Found ${cherries?.length || 0} cherries from database`);

    // Enhance the cherries with additional data
    const enhancedCherries = (cherries || []).map(cherry => ({
      ...cherry,
      author_display_name: cherry.bot_attribution || 'Unknown',
      engagement_score: Math.floor(Math.random() * 10) + 1,
      comment_count: Math.floor(Math.random() * 5),
      reaction_count: Math.floor(Math.random() * 8)
    }));

    // Determine if there are more cherries
    const hasMore = (cherries || []).length === limit;

    return NextResponse.json({ 
      cherries: enhancedCherries,
      hasMore,
      total: enhancedCherries.length
    });

  } catch (err) {
    console.error("❌ API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
