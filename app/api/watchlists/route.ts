import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCacheService } from '../../../lib/cacheService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cacheService = getCacheService();

export async function GET(request: NextRequest) {
  try {
    // Get user from session (implement your auth logic)
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Redis cache first
    const cachedWatchlists = await cacheService.getWatchlist(userId);
    if (cachedWatchlists) {
      return NextResponse.json({ watchlists: cachedWatchlists });
    }

    const { data: watchlists, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('weight', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Watchlist retrieval error:', error);
      return NextResponse.json({ error: 'Failed to retrieve watchlists' }, { status: 500 });
    }

    // Cache the result
    await cacheService.setWatchlist(userId, watchlists || []);

    return NextResponse.json({ watchlists });

  } catch (error) {
    console.error('Watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, kind, value, weight = 1.0 } = await request.json();
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!action || !kind || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate kind
    const validKinds = ['tag', 'person', 'category', 'keyword'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    // Validate weight
    if (weight < 0 || weight > 2) {
      return NextResponse.json({ error: 'Weight must be between 0 and 2' }, { status: 400 });
    }

    if (action === 'add') {
      // Add to watchlist
      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: userId,
          kind,
          value,
          weight
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json({ error: 'Item already in watchlist' }, { status: 409 });
        }
        console.error('Watchlist add error:', error);
        return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
      }

      // Invalidate cache
      await cacheService.invalidateWatchlist(userId);

      return NextResponse.json({ 
        success: true,
        watchlist: data,
        message: 'Added to watchlist'
      });

    } else if (action === 'remove') {
      // Remove from watchlist
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', userId)
        .eq('kind', kind)
        .eq('value', value);

      if (error) {
        console.error('Watchlist remove error:', error);
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
      }

      // Invalidate cache
      await cacheService.invalidateWatchlist(userId);

      return NextResponse.json({ 
        success: true,
        message: 'Removed from watchlist'
      });

    } else if (action === 'update') {
      // Update weight
      const { data, error } = await supabase
        .from('watchlists')
        .update({ weight })
        .eq('user_id', userId)
        .eq('kind', kind)
        .eq('value', value)
        .select()
        .single();

      if (error) {
        console.error('Watchlist update error:', error);
        return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 });
      }

      // Invalidate cache
      await cacheService.invalidateWatchlist(userId);

      return NextResponse.json({ 
        success: true,
        watchlist: data,
        message: 'Watchlist updated'
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get('id');
    
    // Get user from session
    const userId = 'anonymous'; // Replace with actual user ID from session
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!watchlistId) {
      return NextResponse.json({ error: 'Missing watchlist ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('id', watchlistId)
      .eq('user_id', userId);

    if (error) {
      console.error('Watchlist delete error:', error);
      return NextResponse.json({ error: 'Failed to delete from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Removed from watchlist'
    });

  } catch (error) {
    console.error('Watchlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
