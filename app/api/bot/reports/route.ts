import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserId } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Try to resolve user; if missing, return empty list (avoid 500/SWR loops)
    let userId: string | null = null;
    try { userId = await getUserId(); } catch {}
    if (!userId) {
      return NextResponse.json({ reports: [], count: 0, status: 'pending' });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate status
    if (!['pending', 'approved', 'dismissed', 'expired', 'all'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('bot_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by status if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching bot reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ 
      reports: reports || [],
      count: reports?.length || 0,
      status
    });

  } catch (error) {
    console.error('Bot reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { reportId, action } = await request.json();
    
    let userId: string | null = null;
    try { userId = await getUserId(); } catch {}
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate action
    if (!['mark_seen', 'mark_responded'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (action === 'mark_seen') {
      updateData.seen_at = new Date().toISOString();
    } else if (action === 'mark_responded') {
      updateData.responded_at = new Date().toISOString();
    }

    const { data: updatedReport, error } = await supabase
      .from('bot_reports')
      .update(updateData)
      .eq('id', reportId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bot report:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      report: updatedReport,
      message: `Report ${action.replace('_', ' ')} successfully`
    });

  } catch (error) {
    console.error('Bot report update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      kind, 
      payload, 
      confidence_score = 0.5 
    } = await request.json();
    
    let userId: string | null = null;
    try { userId = await getUserId(); } catch {}
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!kind || !payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate kind
    const validKinds = ['found_cherry', 'follow_suggestion', 'reply_suggestion', 'save_suggestion', 'react_suggestion'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json({ error: 'Invalid report kind' }, { status: 400 });
    }

    // Validate confidence score
    if (confidence_score < 0 || confidence_score > 1) {
      return NextResponse.json({ error: 'Confidence score must be between 0 and 1' }, { status: 400 });
    }

    const { data: newReport, error } = await supabase
      .from('bot_reports')
      .insert({
        user_id: userId,
        kind,
        payload,
        confidence_score,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bot report:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('bot_actions')
      .insert({
        user_id: userId,
        action: 'report_generated',
        subject_id: newReport.id,
        subject_type: 'report',
        meta: {
          kind,
          confidence_score,
          payload_keys: Object.keys(payload)
        }
      });

    return NextResponse.json({ 
      success: true,
      report: newReport,
      message: 'Report created successfully'
    });

  } catch (error) {
    console.error('Bot report creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
