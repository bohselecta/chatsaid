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

    const { data: profile, error } = await supabase
      .from('bot_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      console.error('Error fetching bot profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Bot profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate updates
    const validation = validateProfileUpdates(updates);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Update bot profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('bot_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('bot_actions')
      .insert({
        user_id: userId,
        action: 'profile_updated',
        subject_id: userId,
        subject_type: 'user',
        meta: {
          updated_fields: Object.keys(updates),
          new_values: updates
        },
        approved_by_user: true
      });

    return NextResponse.json({ 
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Bot profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateProfileUpdates(updates: any): { valid: boolean; error?: string } {
  // Validate name
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
      return { valid: false, error: 'Name must be a non-empty string' };
    }
    if (updates.name.length > 100) {
      return { valid: false, error: 'Name must be 100 characters or less' };
    }
  }

  // Validate description
  if (updates.description !== undefined) {
    if (updates.description !== null && typeof updates.description !== 'string') {
      return { valid: false, error: 'Description must be a string or null' };
    }
    if (updates.description && updates.description.length > 500) {
      return { valid: false, error: 'Description must be 500 characters or less' };
    }
  }

  // Validate avatar_url
  if (updates.avatar_url !== undefined) {
    if (updates.avatar_url !== null && typeof updates.avatar_url !== 'string') {
      return { valid: false, error: 'Avatar URL must be a string or null' };
    }
    if (updates.avatar_url && !isValidUrl(updates.avatar_url)) {
      return { valid: false, error: 'Avatar URL must be a valid URL' };
    }
  }

  // Validate persona
  if (updates.persona !== undefined) {
    if (typeof updates.persona !== 'object' || updates.persona === null) {
      return { valid: false, error: 'Persona must be an object' };
    }
    
    // Validate persona structure
    if (updates.persona.tone && typeof updates.persona.tone !== 'string') {
      return { valid: false, error: 'Persona tone must be a string' };
    }
    
    if (updates.persona.expertise && !Array.isArray(updates.persona.expertise)) {
      return { valid: false, error: 'Persona expertise must be an array' };
    }
    
    if (updates.persona.personality && typeof updates.persona.personality !== 'string') {
      return { valid: false, error: 'Persona personality must be a string' };
    }
  }

  return { valid: true };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
