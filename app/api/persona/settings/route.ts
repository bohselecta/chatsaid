import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user from session (implement your auth logic)
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Persona retrieval error:', error);
      return NextResponse.json({ error: 'Failed to retrieve persona' }, { status: 500 });
    }

    return NextResponse.json({ persona });

  } catch (error) {
    console.error('Persona error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      displayName, 
      avatarUrl, 
      description, 
      autonomyFlags,
      lastActive 
    } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate autonomy flags if provided
    if (autonomyFlags) {
      const validation = validateAutonomyFlags(autonomyFlags);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {};
    
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return NextResponse.json({ error: 'Display name must be a non-empty string' }, { status: 400 });
      }
      updateData.display_name = displayName.trim();
    }
    
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (autonomyFlags !== undefined) {
      updateData.autonomy_flags = autonomyFlags;
    }
    
    if (lastActive !== undefined) {
      updateData.last_active = lastActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Persona update error:', error);
      return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      persona,
      message: 'Persona updated successfully'
    });

  } catch (error) {
    console.error('Persona error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      displayName, 
      avatarUrl, 
      description, 
      autonomyFlags 
    } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // Validate autonomy flags
    const defaultAutonomyFlags = {
      pingsAllowed: true,
      autoAck: false,
      dailyTokenBudget: 1000,
      quietHours: [22, 8],
      trustedPersonas: [],
      autoLearnTags: 'ask'
    };

    const finalAutonomyFlags = autonomyFlags ? 
      { ...defaultAutonomyFlags, ...autonomyFlags } : 
      defaultAutonomyFlags;

    const validation = validateAutonomyFlags(finalAutonomyFlags);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        user_id: userId,
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        description: description,
        autonomy_flags: finalAutonomyFlags
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Persona already exists for this user' }, { status: 409 });
      }
      console.error('Persona creation error:', error);
      return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      persona,
      message: 'Persona created successfully'
    });

  } catch (error) {
    console.error('Persona error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateAutonomyFlags(flags: any): { valid: boolean; error?: string } {
  if (typeof flags !== 'object' || flags === null) {
    return { valid: false, error: 'Autonomy flags must be an object' };
  }

  // Validate pingsAllowed
  if (flags.pingsAllowed !== undefined && typeof flags.pingsAllowed !== 'boolean') {
    return { valid: false, error: 'pingsAllowed must be a boolean' };
  }

  // Validate autoAck
  if (flags.autoAck !== undefined && typeof flags.autoAck !== 'boolean') {
    return { valid: false, error: 'autoAck must be a boolean' };
  }

  // Validate dailyTokenBudget
  if (flags.dailyTokenBudget !== undefined) {
    if (typeof flags.dailyTokenBudget !== 'number' || flags.dailyTokenBudget < 0 || flags.dailyTokenBudget > 10000) {
      return { valid: false, error: 'dailyTokenBudget must be a number between 0 and 10000' };
    }
  }

  // Validate quietHours
  if (flags.quietHours !== undefined) {
    if (!Array.isArray(flags.quietHours) || flags.quietHours.length !== 2) {
      return { valid: false, error: 'quietHours must be an array of two numbers [start, end]' };
    }
    const [start, end] = flags.quietHours;
    if (typeof start !== 'number' || typeof end !== 'number' || start < 0 || start > 23 || end < 0 || end > 23) {
      return { valid: false, error: 'quietHours must contain numbers between 0 and 23' };
    }
  }

  // Validate trustedPersonas
  if (flags.trustedPersonas !== undefined) {
    if (!Array.isArray(flags.trustedPersonas)) {
      return { valid: false, error: 'trustedPersonas must be an array' };
    }
    if (!flags.trustedPersonas.every((id: any) => typeof id === 'string')) {
      return { valid: false, error: 'trustedPersonas must contain only strings' };
    }
  }

  // Validate autoLearnTags
  if (flags.autoLearnTags !== undefined) {
    const validValues = ['never', 'ask', 'auto-after-3-pins'];
    if (!validValues.includes(flags.autoLearnTags)) {
      return { valid: false, error: 'autoLearnTags must be one of: never, ask, auto-after-3-pins' };
    }
  }

  return { valid: true };
}
