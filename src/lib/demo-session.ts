import { eq } from "drizzle-orm";

import { demoSessionEvents, demoSessions } from "@/src/db/schema";
import { db } from "@/src/lib/db";

export type NewDemoSessionInput = {
  id: string;
  displayName: string;
  mobile: string;
  board: string;
  role: string;
  state: string;
  district: string;
  city: string;
  expiresAt: Date;
  userAgent: string | null;
  ip: string | null;
};

export async function insertDemoSession(input: NewDemoSessionInput) {
  await db.insert(demoSessions).values({
    id: input.id,
    displayName: input.displayName,
    mobile: input.mobile,
    board: input.board,
    role: input.role,
    state: input.state,
    district: input.district,
    city: input.city,
    expiresAt: input.expiresAt,
    userAgent: input.userAgent,
    ip: input.ip,
  });
}

export async function insertDemoSessionEvent(
  sessionId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  await db.insert(demoSessionEvents).values({
    sessionId,
    eventType,
    payload,
  });
}

export async function getDemoSessionById(id: string) {
  return db.query.demoSessions.findFirst({
    where: eq(demoSessions.id, id),
  });
}
