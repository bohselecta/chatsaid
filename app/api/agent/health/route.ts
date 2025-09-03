import { NextRequest, NextResponse } from 'next/server';
import { getCacheService } from '../../../lib/cacheService';
import { getBackgroundWorker } from '../../../lib/backgroundWorker';

export async function GET(request: NextRequest) {
  try {
    const cacheService = getCacheService();
    const backgroundWorker = getBackgroundWorker();

    // Get health status from all services
    const [cacheHealth, workerHealth, cacheStats] = await Promise.all([
      cacheService.healthCheck(),
      backgroundWorker.healthCheck(),
      cacheService.getStats()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cache: {
          healthy: cacheHealth,
          stats: cacheStats
        },
        worker: {
          healthy: workerHealth.running,
          workers: workerHealth.workers,
          cacheHealth: workerHealth.cacheHealth
        }
      }
    };

    // Determine overall health
    if (!cacheHealth || !workerHealth.running) {
      health.status = 'degraded';
    }

    return NextResponse.json(health);

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 500 }
    );
  }
}
