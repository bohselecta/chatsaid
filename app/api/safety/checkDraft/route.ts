import { NextRequest, NextResponse } from 'next/server';
import { createContentSafetyService } from '@/lib/contentSafetyService';

export async function POST(request: NextRequest) {
  try {
    const { content, contentType = 'cherry' } = await request.json();
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content too long for real-time analysis' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Safety service not configured' },
        { status: 503 }
      );
    }

    const safetyService = createContentSafetyService(apiKey);
    const result = await safetyService.analyzeContent(content, contentType);

    let status: 'green' | 'yellow' | 'red';
    let reason: string;

    if (result.should_punt) {
      status = 'red';
      reason = 'This content will likely be punted if submitted.';
    } else if (result.violations.length > 0) {
      status = 'yellow';
      reason = 'Tone might be sharp. Consider softening your language.';
    } else {
      status = 'green';
      reason = 'Looking good!';
    }

    return NextResponse.json({
      status,
      reason,
      violations: result.violations,
      confidence: result.confidence
    });

  } catch (error) {
    console.error('Safety check error:', error);
    return NextResponse.json(
      { error: 'Safety check failed' },
      { status: 500 }
    );
  }
}


