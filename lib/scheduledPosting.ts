import { createAIPersonaService, AIPersonaService } from './aiPersonas';
import { botProfileService } from './botProfiles';

export interface PostingSchedule {
  id: string;
  personaId: string;
  category: string;
  frequency: 'daily' | 'weekly';
  lastPosted: Date | null;
  nextPost: Date;
  isActive: boolean;
}

export class ScheduledPostingService {
  private personaService: AIPersonaService;
  private schedules: PostingSchedule[] = [];
  private isRunning: boolean = false;

  constructor(apiKey: string) {
    this.personaService = createAIPersonaService(apiKey);
    this.initializeSchedules();
  }

  private initializeSchedules(): void {
    // Cherry_Ent posts daily in different categories
    this.schedules = [
      {
        id: 'cherry_ent_funny',
        personaId: 'cherry_ent',
        category: 'funny',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(),
        isActive: true
      },
      {
        id: 'cherry_ent_technical',
        personaId: 'cherry_ent',
        category: 'technical',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours later
        isActive: true
      },
      {
        id: 'cherry_ent_ideas',
        personaId: 'cherry_ent',
        category: 'ideas',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours later
        isActive: true
      },
      // Crystal_Maize posts daily in different categories
      {
        id: 'crystal_maize_weird',
        personaId: 'crystal_maize',
        category: 'weird',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours later
        isActive: true
      },
      {
        id: 'crystal_maize_research',
        personaId: 'crystal_maize',
        category: 'research',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(Date.now() + 14 * 60 * 60 * 1000), // 14 hours later
        isActive: true
      },
      {
        id: 'crystal_maize_ideas',
        personaId: 'crystal_maize',
        category: 'ideas',
        frequency: 'daily',
        lastPosted: null,
        nextPost: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours later
        isActive: true
      }
    ];
  }

  async startScheduledPosting(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduled posting is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Persona scheduled posting...');

    // Bot profiles are managed elsewhere, no initialization needed here

    // Check for posts every 30 minutes
    setInterval(async () => {
      await this.checkAndPost();
    }, 30 * 60 * 1000);

    // Initial check
    await this.checkAndPost();
  }

  async stopScheduledPosting(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Stopped AI Persona scheduled posting');
  }

  private async checkAndPost(): Promise<void> {
    if (!this.isRunning) return;

    const now = new Date();
    const dueSchedules = this.schedules.filter(
      schedule => schedule.isActive && schedule.nextPost <= now
    );

    for (const schedule of dueSchedules) {
      try {
        await this.executeSchedule(schedule);
      } catch (error) {
        console.error(`Error executing schedule ${schedule.id}:`, error);
      }
    }
  }

  private async executeSchedule(schedule: PostingSchedule): Promise<void> {
    try {
      console.log(`🎭 Executing schedule: ${schedule.personaId} -> ${schedule.category}`);

      // Generate post using AI
      const generatedPost = await this.personaService.generatePost(
        schedule.personaId,
        schedule.category
      );

      // Get bot profile ID
      const botId = schedule.personaId === 'cherry_ent' ? 'cherry_ent_bot' : 'crystal_maize_bot';

      // Create the cherry in the database
      const cherryId = await botProfileService.createBotCherry(botId, generatedPost);

      if (cherryId) {
        // Update schedule
        schedule.lastPosted = new Date();
        schedule.nextPost = this.calculateNextPost(schedule);
        
        console.log(`✅ Posted AI cherry: ${generatedPost.title || generatedPost.content.substring(0, 50)}`);
        console.log(`📅 Next post scheduled for: ${schedule.nextPost.toLocaleString()}`);
      }
    } catch (error) {
      console.error(`Error executing schedule ${schedule.id}:`, error);
      
      // Reschedule for later if there was an error
      schedule.nextPost = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours later
    }
  }

  private calculateNextPost(schedule: PostingSchedule): Date {
    const now = new Date();
    
    if (schedule.frequency === 'daily') {
      // Add 24 hours plus some randomization (18-30 hours)
      const hoursToAdd = 18 + Math.random() * 12;
      return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    } else {
      // Weekly - add 7 days plus some randomization
      const daysToAdd = 7 + Math.random() * 2;
      return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
  }

  // Manual trigger for testing
  async triggerManualPost(personaId: string, category: string): Promise<boolean> {
    try {
      const generatedPost = await this.personaService.generatePost(personaId, category);
      const botId = personaId === 'cherry_ent' ? 'cherry_ent_bot' : 'crystal_maize_bot';
      
      const cherryId = await botProfileService.createBotCherry(botId, generatedPost);
      return !!cherryId;
    } catch (error) {
      console.error('Error in manual post:', error);
      return false;
    }
  }

  // Get posting statistics
  getPostingStats(): {
    totalSchedules: number;
    activeSchedules: number;
    nextPosts: Array<{ persona: string; category: string; nextPost: Date }>;
  } {
    const activeSchedules = this.schedules.filter(s => s.isActive);
    const nextPosts = activeSchedules.map(s => ({
      persona: s.personaId,
      category: s.category,
      nextPost: s.nextPost
    }));

    return {
      totalSchedules: this.schedules.length,
      activeSchedules: activeSchedules.length,
      nextPosts
    };
  }

  // Update schedule settings
  updateSchedule(scheduleId: string, updates: Partial<PostingSchedule>): void {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
    }
  }
}

export function createScheduledPostingService(apiKey: string): ScheduledPostingService {
  return new ScheduledPostingService(apiKey);
}
