import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserId } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Resolve user (return demo defaults if unauthenticated)
    let userId: string | null = null;
    try { userId = await getUserId(); } catch { /* unauthenticated */ }
    if (!userId) {
      return NextResponse.json({
        settings: {
          autonomy_level: 'suggestive',
          category_scope: ['Technical', 'Funny', 'Ideas'],
          daily_save_cap: 5,
          daily_react_cap: 15,
          is_active: false,
        },
        profile: {
          name: 'My Assistant',
          description: 'Sign in to personalize your bot.',
          persona: { tone: 'friendly' },
        }
      });
    }

    // Fetch bot settings and profile
    const [settingsResult, profileResult] = await Promise.all([
      supabase
        .from('bot_settings')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('bot_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
    ]);

    // Handle missing settings - create defaults
    let settings = settingsResult.data;
    if (settingsResult.error && settingsResult.error.code === 'PGRST116') {
      // No settings found, create defaults
      const { data: newSettings, error: createError } = await supabase
        .from('bot_settings')
        .insert({
          user_id: userId,
          autonomy_level: 'suggestive',
          category_scope: ['Technical', 'Funny', 'Ideas'],
          daily_save_cap: 5,
          daily_react_cap: 15,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default settings:', createError);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
      }
      settings = newSettings;
    } else if (settingsResult.error) {
      console.error('Error fetching settings:', settingsResult.error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Handle missing profile - create defaults
    let profile = profileResult.data;
    if (profileResult.error && profileResult.error.code === 'PGRST116') {
      // No profile found, create defaults
      const { data: newProfile, error: createError } = await supabase
        .from('bot_profiles')
        .insert({
          user_id: userId,
          name: 'My Assistant',
          description: 'Your personal AI companion for exploring and organizing cherries',
          persona: {
            tone: 'friendly',
            expertise: ['content_discovery', 'organization', 'summarization'],
            personality: 'helpful and curious'
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      profile = newProfile;
    } else if (profileResult.error) {
      console.error('Error fetching profile:', profileResult.error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      settings,
      profile
    });

  } catch (error) {
    console.error('Bot settings error:', error);
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
    const validation = validateSettingsUpdates(updates);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Update bot settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('bot_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating settings:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // Log the action
    await supabase
      .from('bot_actions')
      .insert({
        user_id: userId,
        action: 'settings_updated',
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
      settings: updatedSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Bot settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateSettingsUpdates(updates: any): { valid: boolean; error?: string } {
  // Validate autonomy_level
  if (updates.autonomy_level !== undefined) {
    if (!['passive', 'suggestive', 'active'].includes(updates.autonomy_level)) {
      return { valid: false, error: 'Invalid autonomy level' };
    }
  }

  // Validate category_scope
  if (updates.category_scope !== undefined) {
    if (!Array.isArray(updates.category_scope)) {
      return { valid: false, error: 'Category scope must be an array' };
    }
    if (!updates.category_scope.every((cat: any) => typeof cat === 'string')) {
      return { valid: false, error: 'All categories must be strings' };
    }
  }

  // Validate daily_save_cap
  if (updates.daily_save_cap !== undefined) {
    if (typeof updates.daily_save_cap !== 'number' || updates.daily_save_cap < 0 || updates.daily_save_cap > 100) {
      return { valid: false, error: 'Daily save cap must be a number between 0 and 100' };
    }
  }

  // Validate daily_react_cap
  if (updates.daily_react_cap !== undefined) {
    if (typeof updates.daily_react_cap !== 'number' || updates.daily_react_cap < 0 || updates.daily_react_cap > 1000) {
      return { valid: false, error: 'Daily react cap must be a number between 0 and 1000' };
    }
  }

  // Validate is_active
  if (updates.is_active !== undefined) {
    if (typeof updates.is_active !== 'boolean') {
      return { valid: false, error: 'is_active must be a boolean' };
    }
  }

  // Validate snoozed_until
  if (updates.snoozed_until !== undefined) {
    if (updates.snoozed_until !== null && !isValidDate(updates.snoozed_until)) {
      return { valid: false, error: 'snoozed_until must be a valid date or null' };
    }
  }

  return { valid: true };
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
