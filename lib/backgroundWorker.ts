/**
 * Background Worker Service for ChatSaid Agent System
 * Handles heavy operations like digest generation, ping processing, and LLM tasks
 */

import { createClient } from '@supabase/supabase-js';
import { getCacheService } from './cacheService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Job {
  id: string;
  type: string;
  payload: any;
  priority: number;
  createdAt: string;
  attempts: number;
  maxAttempts: number;
}

interface WorkerConfig {
  concurrency: number;
  pollInterval: number;
  maxRetries: number;
  retryDelay: number;
}

class BackgroundWorker {
  private isRunning = false;
  private workers: Worker[] = [];
  private cacheService = getCacheService();

  constructor(private config: WorkerConfig = {
    concurrency: 3,
    pollInterval: 5000,
    maxRetries: 3,
    retryDelay: 30000
  }) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background worker already running');
      return;
    }

    console.log('Starting background worker...');
    this.isRunning = true;

    // Start worker processes
    for (let i = 0; i < this.config.concurrency; i++) {
      const worker = new Worker(i);
      this.workers.push(worker);
      worker.start();
    }

    console.log(`Background worker started with ${this.config.concurrency} workers`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping background worker...');
    this.isRunning = false;

    // Stop all workers
    await Promise.all(this.workers.map(worker => worker.stop()));
    this.workers = [];

    console.log('Background worker stopped');
  }

  // Job enqueueing methods
  async enqueueDigestGeneration(userId: string, timeWindow?: { start: string; end: string }): Promise<string> {
    return await this.cacheService.enqueueJob('digest_generation', {
      userId,
      timeWindow,
      priority: 1
    }, 1);
  }

  async enqueuePingProcessing(pingId: string, fromPersonaId: string, toPersonaId: string): Promise<string> {
    return await this.cacheService.enqueueJob('ping_processing', {
      pingId,
      fromPersonaId,
      toPersonaId
    }, 2);
  }

  async enqueueLLMSummarization(content: string, tags: string[], watchlist: any[]): Promise<string> {
    return await this.cacheService.enqueueJob('llm_summarization', {
      content,
      tags,
      watchlist
    }, 3);
  }

  async enqueueWatchlistUpdate(userId: string, watchlist: any[]): Promise<string> {
    return await this.cacheService.enqueueJob('watchlist_update', {
      userId,
      watchlist
    }, 4);
  }

  // Health check
  async healthCheck(): Promise<any> {
    return {
      running: this.isRunning,
      workers: this.workers.length,
      cacheHealth: await this.cacheService.healthCheck()
    };
  }
}

class Worker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private cacheService = getCacheService();

  constructor(private id: number) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log(`Worker ${this.id} started`);

    // Start polling for jobs
    this.intervalId = setInterval(async () => {
      await this.processJobs();
    }, 5000); // Poll every 5 seconds
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log(`Worker ${this.id} stopped`);
  }

  private async processJobs(): Promise<void> {
    try {
      // Process different job types in priority order
      const jobTypes = ['digest_generation', 'ping_processing', 'llm_summarization', 'watchlist_update'];
      
      for (const jobType of jobTypes) {
        const job = await this.cacheService.dequeueJob(jobType);
        if (job) {
          await this.processJob(job);
          break; // Process one job at a time
        }
      }
    } catch (error) {
      console.error(`Worker ${this.id} error:`, error);
    }
  }

  private async processJob(job: Job): Promise<void> {
    console.log(`Worker ${this.id} processing job ${job.id} of type ${job.type}`);

    try {
      switch (job.type) {
        case 'digest_generation':
          await this.processDigestGeneration(job);
          break;
        case 'ping_processing':
          await this.processPingProcessing(job);
          break;
        case 'llm_summarization':
          await this.processLLMSummarization(job);
          break;
        case 'watchlist_update':
          await this.processWatchlistUpdate(job);
          break;
        default:
          console.warn(`Unknown job type: ${job.type}`);
      }
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error);
    }
  }

  private async processDigestGeneration(job: Job): Promise<void> {
    const { userId, timeWindow } = job.payload;
    
    // Import the digest generation logic
    const { generateDigestForUser } = await import('../app/api/agent/digest/route');
    
    // Generate digest
    const digest = await generateDigestForUser(userId, timeWindow);
    
    // Cache the result
    const timeSliceKey = `${timeWindow?.start || 'default'}_${timeWindow?.end || 'default'}`;
    await this.cacheService.setDigest(userId, timeSliceKey, digest);
    
    console.log(`Digest generated for user ${userId}`);
  }

  private async processPingProcessing(job: Job): Promise<void> {
    const { pingId, fromPersonaId, toPersonaId } = job.payload;
    
    // Update ping status
    await supabase
      .from('pings')
      .update({ status: 'sent' })
      .eq('id', pingId);

    // Log the action
    await supabase
      .from('agent_actions')
      .insert({
        persona_id: toPersonaId,
        action_type: 'ping_received',
        target_id: pingId,
        metadata: { action: 'processed' }
      });

    console.log(`Ping ${pingId} processed`);
  }

  private async processLLMSummarization(job: Job): Promise<void> {
    const { content, tags, watchlist } = job.payload;
    
    // Import the LLM summarization logic
    const { generateTLDR } = await import('../app/api/agent/digest/route');
    
    // Generate summary
    const summary = await generateTLDR(content, tags, watchlist);
    
    // Store result (could be cached or stored in database)
    console.log(`LLM summarization completed: ${summary.substring(0, 50)}...`);
  }

  private async processWatchlistUpdate(job: Job): Promise<void> {
    const { userId, watchlist } = job.payload;
    
    // Update cache
    await this.cacheService.setWatchlist(userId, watchlist);
    
    // Invalidate related caches
    await this.cacheService.invalidatePersona(userId);
    
    console.log(`Watchlist updated for user ${userId}`);
  }

  private async handleJobFailure(job: Job, error: any): Promise<void> {
    job.attempts += 1;
    
    if (job.attempts < job.maxAttempts) {
      // Retry the job
      console.log(`Retrying job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      
      // Re-enqueue with delay
      setTimeout(async () => {
        await this.cacheService.enqueueJob(job.type, job.payload, job.priority);
      }, 30000); // 30 second delay
    } else {
      // Job failed permanently
      console.error(`Job ${job.id} failed permanently after ${job.maxAttempts} attempts:`, error);
      
      // Log the failure
      await supabase
        .from('agent_actions')
        .insert({
          persona_id: 'system',
          action_type: 'job_failed',
          target_id: job.id,
          metadata: {
            jobType: job.type,
            error: error.message,
            attempts: job.attempts
          }
        });
    }
  }
}

// Singleton instance
let backgroundWorker: BackgroundWorker | null = null;

export function getBackgroundWorker(): BackgroundWorker {
  if (!backgroundWorker) {
    backgroundWorker = new BackgroundWorker();
  }
  return backgroundWorker;
}

export default BackgroundWorker;
