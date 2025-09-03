/**
 * Startup script for ChatSaid Agent System
 * Initializes cache service and background worker
 */

import { getCacheService } from './cacheService';
import { getBackgroundWorker } from './backgroundWorker';

let isInitialized = false;

export async function initializeAgentSystem(): Promise<void> {
  if (isInitialized) {
    console.log('Agent system already initialized');
    return;
  }

  try {
    console.log('Initializing ChatSaid Agent System...');

    // Initialize cache service
    const cacheService = getCacheService();
    await cacheService.connect();
    
    // Check cache health
    const cacheHealth = await cacheService.healthCheck();
    console.log('Cache service health:', cacheHealth);

    // Initialize background worker
    const backgroundWorker = getBackgroundWorker();
    await backgroundWorker.start();
    
    // Check worker health
    const workerHealth = await backgroundWorker.healthCheck();
    console.log('Background worker health:', workerHealth);

    isInitialized = true;
    console.log('Agent system initialized successfully');

  } catch (error) {
    console.error('Failed to initialize agent system:', error);
    throw error;
  }
}

export async function shutdownAgentSystem(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  try {
    console.log('Shutting down ChatSaid Agent System...');

    // Stop background worker
    const backgroundWorker = getBackgroundWorker();
    await backgroundWorker.stop();

    // Disconnect cache service
    const cacheService = getCacheService();
    await cacheService.disconnect();

    isInitialized = false;
    console.log('Agent system shut down successfully');

  } catch (error) {
    console.error('Error during agent system shutdown:', error);
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeAgentSystem().catch(console.error);
}

// Graceful shutdown
process.on('SIGINT', shutdownAgentSystem);
process.on('SIGTERM', shutdownAgentSystem);
