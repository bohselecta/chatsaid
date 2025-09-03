import { NextRequest, NextResponse } from 'next/server';
import { BotInteractionScheduler } from '@/lib/botInteractionScheduler';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      // Start the bot interaction scheduler
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      const scheduler = new BotInteractionScheduler(apiKey);
      await scheduler.start();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Bot interaction scheduler started' 
      });
    }
    
    if (action === 'stop') {
      // Stop the bot interaction scheduler
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      const scheduler = new BotInteractionScheduler(apiKey);
      await scheduler.stop();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Bot interaction scheduler stopped' 
      });
    }
    
    if (action === 'process') {
      // Process pending interactions
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      const scheduler = new BotInteractionScheduler(apiKey);
      const processed = await scheduler.processPendingInteractions();
      
      return NextResponse.json({ 
        success: true, 
        message: `Processed ${processed} interactions`,
        processed
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use: start, stop, or process' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Bot interaction processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process bot interactions' },
      { status: 500 }
    );
  }
}

