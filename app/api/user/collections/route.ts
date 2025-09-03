import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the same approach as the working simulation script
const supabaseUrl = 'https://zmfrpezmkihqtkjkzqsa.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZnJwZXpta2locXRramt6cXNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNTIzOSwiZXhwIjoyMDUxMDczNjAwfQ.WqTSD_1TV-B3flCG3U7rn4rkC1Xg2fzFrxjwsQdOZ2c';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// GET user's cherry collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category'); // Optional filter by reaction type
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

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
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && ['heart', 'star', 'zap'].includes(category)) {
      query = query.eq("reaction_type", category);
    }

    const { data: collections, error } = await query;

    if (error) {
      console.error("Fetch collections error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("user_cherry_collections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return NextResponse.json({
      collections: collections || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    });

  } catch (err) {
    console.error("Collections API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// POST to add a note to a collection
export async function POST(request: NextRequest) {
  try {
    const { collectionId, note } = await request.json();

    if (!collectionId) {
      return NextResponse.json({ error: "Missing collectionId" }, { status: 400 });
    }

    const { data: updatedCollection, error } = await supabase
      .from("user_cherry_collections")
      .update({ 
        collection_note: note,
        updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .select()
      .single();

    if (error) {
      console.error("Update collection error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      collection: updatedCollection,
      message: "Collection note updated successfully"
    });

  } catch (err) {
    console.error("Update collection API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// DELETE to remove a cherry from collection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json({ error: "Missing collectionId parameter" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_cherry_collections")
      .delete()
      .eq("id", collectionId);

    if (error) {
      console.error("Delete collection error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Cherry removed from collection successfully"
    });

  } catch (err) {
    console.error("Delete collection API error:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
