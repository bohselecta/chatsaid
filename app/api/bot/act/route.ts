import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { reportId, decision, metadata = {} } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!reportId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate decision
    if (!['approve', 'dismiss'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get the report
    const { data: report, error: fetchError } = await supabase
      .from('bot_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'pending') {
      return NextResponse.json({ error: 'Report already processed' }, { status: 400 });
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('bot_reports')
      .update({
        status: decision === 'approve' ? 'approved' : 'dismissed',
        responded_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    // Execute the action if approved
    if (decision === 'approve') {
      await executeApprovedAction(report, userId, metadata);
    }

    // Log the action
    await supabase
      .from('bot_actions')
      .insert({
        user_id: userId,
        action: decision === 'approve' ? 'approve_report' : 'dismiss_report',
        subject_id: reportId,
        subject_type: 'report',
        meta: {
          report_kind: report.kind,
          confidence_score: report.confidence_score,
          decision,
          metadata
        },
        approved_by_user: true
      });

    return NextResponse.json({ 
      success: true,
      report: updatedReport,
      message: `Report ${decision}d successfully`
    });

  } catch (error) {
    console.error('Bot action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeApprovedAction(report: any, userId: string, metadata: any) {
  try {
    switch (report.kind) {
      case 'found_cherry':
      case 'save_suggestion':
        await handleSaveCherry(report, userId, metadata);
        break;
      case 'follow_suggestion':
        await handleFollowBot(report, userId, metadata);
        break;
      case 'reply_suggestion':
        await handleReplySuggestion(report, userId, metadata);
        break;
      case 'react_suggestion':
        await handleReactSuggestion(report, userId, metadata);
        break;
      default:
        console.warn('Unknown report kind:', report.kind);
    }
  } catch (error) {
    console.error('Error executing approved action:', error);
    // Don't throw - we still want to mark the report as approved
  }
}

async function handleSaveCherry(report: any, userId: string, metadata: any) {
  const { cherry_id, cherry_title, cherry_content, category = 'ideas' } = report.payload;
  
  if (!cherry_id) {
    console.warn('No cherry_id in save suggestion');
    return;
  }

  // Add to user cherry buckets
  const { error } = await supabase
    .from('user_cherry_buckets')
    .insert({
      user_id: userId,
      cherry_id,
      category,
      cherry_text: cherry_content || cherry_title || 'Saved cherry',
      provenance: {
        source: 'bot_suggestion',
        report_id: report.id,
        confidence: report.confidence_score
      },
      source: 'bot_suggestion'
    });

  if (error) {
    console.error('Error saving cherry:', error);
  }
}

async function handleFollowBot(report: any, userId: string, metadata: any) {
  const { bot_id } = report.payload;
  
  if (!bot_id) {
    console.warn('No bot_id in follow suggestion');
    return;
  }

  // Add to user's following list (assuming you have a follows table)
  // This would depend on your existing follow system
  console.log('Would follow bot:', bot_id);
  
  // For now, just log the action
  await supabase
    .from('bot_actions')
    .insert({
      user_id: userId,
      action: 'follow_bot',
      subject_id: bot_id,
      subject_type: 'bot',
      meta: {
        report_id: report.id,
        bot_name: report.payload.bot_name
      },
      approved_by_user: true
    });
}

async function handleReplySuggestion(report: any, userId: string, metadata: any) {
  const { cherry_id, reply_text } = report.payload;
  
  if (!cherry_id || !reply_text) {
    console.warn('Missing cherry_id or reply_text in reply suggestion');
    return;
  }

  // Add comment to the cherry
  const { error } = await supabase
    .from('comments')
    .insert({
      cherry_id,
      author_id: userId,
      content: reply_text,
      is_bot_comment: false // User approved it, so it's their comment
    });

  if (error) {
    console.error('Error adding reply:', error);
  }
}

async function handleReactSuggestion(report: any, userId: string, metadata: any) {
  const { cherry_id, reaction_type = 'like' } = report.payload;
  
  if (!cherry_id) {
    console.warn('No cherry_id in react suggestion');
    return;
  }

  // Add reaction to the cherry
  // This would depend on your existing reaction system
  console.log('Would react to cherry:', cherry_id, 'with:', reaction_type);
  
  // For now, just log the action
  await supabase
    .from('bot_actions')
    .insert({
      user_id: userId,
      action: 'react_to_cherry',
      subject_id: cherry_id,
      subject_type: 'cherry',
      meta: {
        report_id: report.id,
        reaction_type
      },
      approved_by_user: true
    });
}
