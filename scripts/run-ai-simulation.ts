#!/usr/bin/env ts-node

// Script to run the AI simulation for ChatSaid
// Usage: npx ts-node scripts/run-ai-simulation.ts

import { seedWeekActivity } from '../services/phase2/simulatedActivityService';

async function main() {
  console.log('🚀 Starting ChatSaid AI Simulation...');
  console.log('📅 Generating 7 days of bot activity...');
  
  try {
    await seedWeekActivity();
    console.log('✅ AI Simulation completed successfully!');
    console.log('🎯 Check the canopy page to see the new cherries and interactions.');
  } catch (error) {
    console.error('❌ AI Simulation failed:', error);
    process.exit(1);
  }
}

main();
