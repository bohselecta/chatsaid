import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configuration
const RATE_LIMITS = {
  pingsPerHour: 5,
  pingsPerDay: 20
};

export async function POST(request: NextRequest) {
  try {
    const { fromPersonaId, toPersonaId, threadId, maxWords = 200, scope = 'public' } = await request.json();
    
    // Get user from session (implement your auth logic)
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!fromPersonaId || !toPersonaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify sender owns the from persona
    const { data: fromPersona } = await supabase
      .from('personas')
      .select('user_id, autonomy_flags')
      .eq('id', fromPersonaId)
      .single();

    if (!fromPersona || fromPersona.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to send from this persona' }, { status: 403 });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(fromPersonaId);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        retryAfter: rateLimitCheck.retryAfter 
      }, { status: 429 });
    }

    // Verify target persona exists
    const { data: toPersona } = await supabase
      .from('personas')
      .select('user_id, autonomy_flags')
      .eq('id', toPersonaId)
      .single();

    if (!toPersona) {
      return NextResponse.json({ error: 'Target persona not found' }, { status: 404 });
    }

    // Check if target persona allows pings
    const targetAutonomy = toPersona.autonomy_flags || {};
    if (!targetAutonomy.pingsAllowed) {
      return NextResponse.json({ error: 'Target persona does not accept pings' }, { status: 403 });
    }

    // Create ping record
    const { data: ping, error } = await supabase
      .from('pings')
      .insert({
        from_persona_id: fromPersonaId,
        to_persona_id: toPersonaId,
        thread_id: threadId,
        max_words: maxWords,
        scope: scope,
        status: 'queued',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (error) {
      console.error('Ping creation error:', error);
      return NextResponse.json({ error: 'Failed to create ping' }, { status: 500 });
    }

    // Log agent action
    await supabase
      .from('agent_actions')
      .insert({
        persona_id: fromPersonaId,
        action_type: 'ping_sent',
        target_id: toPersonaId,
        metadata: {
          thread_id: threadId,
          max_words: maxWords,
          scope: scope
        }
      });

    // Check if target persona can auto-reply
    if (targetAutonomy.autoAck) {
      // Auto-reply with basic acknowledgment
      await processAutoReply(ping.id, toPersonaId, fromPersonaId);
    } else {
      // Queue for human review
      await queueForHumanReview(ping.id, toPersonaId);
    }

    return NextResponse.json({ 
      pingId: ping.id,
      status: targetAutonomy.autoAck ? 'auto_replied' : 'queued_for_review',
      message: targetAutonomy.autoAck 
        ? 'Ping sent and auto-acknowledged' 
        : 'Ping sent and queued for review'
    });

  } catch (error) {
    console.error('Ping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId');
    const status = searchParams.get('status');
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!personaId) {
      return NextResponse.json({ error: 'Missing personaId' }, { status: 400 });
    }

    // Verify user owns the persona
    const { data: persona } = await supabase
      .from('personas')
      .select('user_id')
      .eq('id', personaId)
      .single();

    if (!persona || persona.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('pings')
      .select(`
        *,
        from_persona:personas!pings_from_persona_id_fkey(display_name, avatar_url),
        to_persona:personas!pings_to_persona_id_fkey(display_name, avatar_url)
      `)
      .or(`from_persona_id.eq.${personaId},to_persona_id.eq.${personaId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: pings, error } = await query;

    if (error) {
      console.error('Ping retrieval error:', error);
      return NextResponse.json({ error: 'Failed to retrieve pings' }, { status: 500 });
    }

    return NextResponse.json({ pings });

  } catch (error) {
    console.error('Ping retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { pingId, action, response } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!pingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get ping and verify user owns the target persona
    const { data: ping } = await supabase
      .from('pings')
      .select(`
        *,
        to_persona:personas!pings_to_persona_id_fkey(user_id)
      `)
      .eq('id', pingId)
      .single();

    if (!ping || ping.to_persona.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (ping.status !== 'queued') {
      return NextResponse.json({ error: 'Ping is not in queued status' }, { status: 400 });
    }

    // Update ping based on action
    let updateData: any = {};
    
    switch (action) {
      case 'reply':
        if (!response) {
          return NextResponse.json({ error: 'Response required for reply action' }, { status: 400 });
        }
        updateData = {
          status: 'replied',
          response: response,
          replied_at: new Date().toISOString()
        };
        break;
      case 'block':
        updateData = {
          status: 'blocked'
        };
        break;
      case 'expire':
        updateData = {
          status: 'expired'
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pings')
      .update(updateData)
      .eq('id', pingId);

    if (error) {
      console.error('Ping update error:', error);
      return NextResponse.json({ error: 'Failed to update ping' }, { status: 500 });
    }

    // Log agent action
    await supabase
      .from('agent_actions')
      .insert({
        persona_id: ping.to_persona_id,
        action_type: action === 'reply' ? 'ping_received' : 'ping_blocked',
        target_id: pingId,
        metadata: {
          action: action,
          response: response
        }
      });

    return NextResponse.json({ 
      success: true,
      status: updateData.status,
      message: `Ping ${action} successful`
    });

  } catch (error) {
    console.error('Ping update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkRateLimit(personaId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check hourly limit
  const { count: hourlyCount } = await supabase
    .from('pings')
    .select('*', { count: 'exact', head: true })
    .eq('from_persona_id', personaId)
    .gte('created_at', oneHourAgo.toISOString());

  if (hourlyCount && hourlyCount >= RATE_LIMITS.pingsPerHour) {
    return { 
      allowed: false, 
      retryAfter: 60 * 60 // 1 hour in seconds
    };
  }

  // Check daily limit
  const { count: dailyCount } = await supabase
    .from('pings')
    .select('*', { count: 'exact', head: true })
    .eq('from_persona_id', personaId)
    .gte('created_at', oneDayAgo.toISOString());

  if (dailyCount && dailyCount >= RATE_LIMITS.pingsPerDay) {
    return { 
      allowed: false, 
      retryAfter: 24 * 60 * 60 // 24 hours in seconds
    };
  }

  return { allowed: true };
}

async function processAutoReply(pingId: string, toPersonaId: string, fromPersonaId: string) {
  // Generate auto-reply based on persona's settings
  const autoReply = "Thanks for the ping! I'll review this and get back to you soon.";
  
  await supabase
    .from('pings')
    .update({
      status: 'replied',
      response: autoReply,
      replied_at: new Date().toISOString()
    })
    .eq('id', pingId);

  // Log the auto-reply
  await supabase
    .from('agent_actions')
    .insert({
      persona_id: toPersonaId,
      action_type: 'ping_received',
      target_id: pingId,
      metadata: {
        action: 'auto_reply',
        response: autoReply
      }
    });
}

async function queueForHumanReview(pingId: string, toPersonaId: string) {
  // Update status to indicate it's waiting for human review
  await supabase
    .from('pings')
    .update({ status: 'sent' })
    .eq('id', pingId);

  // Log the queuing
  await supabase
    .from('agent_actions')
    .insert({
      persona_id: toPersonaId,
      action_type: 'ping_received',
      target_id: pingId,
      metadata: {
        action: 'queued_for_review'
      }
    });
}
