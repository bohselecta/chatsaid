import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the same approach as the working simulation script
const supabaseUrl = 'https://zmfrpezmkihqtkjkzqsa.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnJwZXpta2locXRramt6cXNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNTIzOSwiZXhwIjoyMDUxMDczNjAwfQ.WqTSD_1TV-B3flCG3U7rn4rkC1Xg2fzFrxjwsQdOZ2c';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const { cherryId, userId, reactionType } = await request.json();

    if (!cherryId || !userId || !reactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate reaction type
    if (!['heart', 'star', 'zap'].includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from("user_reactions")
      .select("id")
      .eq("cherry_id", cherryId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType)
      .single();

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      const { error: deleteError } = await supabase
        .from("user_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        console.error("Delete reaction error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      // Note: The trigger will automatically remove from user_cherry_collections
      return NextResponse.json({
        action: "removed",
        reaction: null,
        message: "Cherry unpicked from your collection"
      });
    }

    // Remove any existing reaction from this user to this cherry (one reaction per cherry per user)
    const { error: deleteExistingError } = await supabase
      .from("user_reactions")
      .delete()
      .eq("cherry_id", cherryId)
      .eq("user_id", userId);

    if (deleteExistingError) {
      console.error("Delete existing reaction error:", deleteExistingError);
      return NextResponse.json({ error: deleteExistingError.message }, { status: 500 });
    }

    // Add new reaction
    const { data: newReaction, error: insertError } = await supabase
      .from("user_reactions")
      .insert([{
        cherry_id: cherryId,
        user_id: userId,
        reaction_type: reactionType,
        simulated_activity: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Insert reaction error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Get the cherry details for the response
    const { data: cherry } = await supabase
      .from("cherries")
      .select("title, content, bot_attribution")
      .eq("id", cherryId)
      .single();

    // Note: The trigger will automatically add to user_cherry_collections

    return NextResponse.json({
      action: "added",
      reaction: newReaction,
      cherry: cherry,
      message: `Cherry "${cherry?.title || 'Untitled'}" picked for your AI companion to learn from!`
    });

  } catch (err) {
    console.error("Reactions API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// GET endpoint to fetch user's cherry collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category'); // Optional filter by reaction type

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    let query = supabase
      .from("user_cherry_collections")
      .select(`
        id,
        reaction_type,
        collection_note,
        ai_learning_status,
        ai_insights,
        created_at,
        cherries (
          id,
          title,
          content,
          bot_attribution,
          tags,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (category && ['heart', 'star', 'zap'].includes(category)) {
      query = query.eq("reaction_type", category);
    }

    const { data: collections, error } = await query;

    if (error) {
      console.error("Fetch collections error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      collections: collections || [],
      total: collections?.length || 0
    });

  } catch (err) {
    console.error("Collections API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
