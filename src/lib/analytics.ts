import { db } from "../db"; 
import { analyticsEvents } from "../db/schema"; 

interface AnalyticsOptions {
  eventType: string;
  userId?: string;
  payload?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export async function recordAnalyticsEvent(opts: AnalyticsOptions): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventType: opts.eventType,
      userId: opts.userId || null,
      payload: opts.payload || {}, 
      ip: opts.ip || null,
      userAgent: opts.userAgent || null,
    });
    
    console.log(`[Analytics] Success: ${opts.eventType}`);
  } catch (error) {
    // If it still fails, we log the specific code (e.g., SELF_SIGNED_CERT)
    console.error("[Analytics] DB Error:", error);
  }
}