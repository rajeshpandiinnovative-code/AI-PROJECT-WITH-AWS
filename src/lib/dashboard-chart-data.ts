export type ChartBar = { name: string; value: number };

export type DashboardChartsPayload = {
  mode: "school" | "demo";
  overview: ChartBar[];
  marksBands: ChartBar[];
  moduleAttempts: ChartBar[];
  interventionPipeline: ChartBar[];
  /** Last 7 calendar days — module events per day (school) or synthetic (demo). */
  activityTrend: ChartBar[];
  roleInsight?: ChartBar[];
};

function hashSeed(parts: string[]): number {
  const s = parts.join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Buckets module usage by local calendar day for the last 7 days (label M/D). */
export function buildActivityTrendFromModuleEvents(events: { createdAt: Date }[], now: Date): ChartBar[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    days.push(d);
  }
  const labels = days.map((d) => `${d.getMonth() + 1}/${d.getDate()}`);
  const counts = days.map((day) => {
    let n = 0;
    for (const ev of events) {
      if (
        ev.createdAt.getFullYear() === day.getFullYear() &&
        ev.createdAt.getMonth() === day.getMonth() &&
        ev.createdAt.getDate() === day.getDate()
      ) {
        n++;
      }
    }
    return n;
  });
  return labels.map((name, i) => ({ name, value: counts[i] }));
}

export function buildMarksBandsFromMarks(recentMarks: number[]): ChartBar[] {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  for (const m of recentMarks) {
    if (m < 40) {
      b0++;
    } else if (m < 60) {
      b1++;
    } else if (m < 80) {
      b2++;
    } else {
      b3++;
    }
  }
  return [
    { name: "0–39", value: b0 },
    { name: "40–59", value: b1 },
    { name: "60–79", value: b2 },
    { name: "80–100", value: b3 },
  ];
}

export type DemoContextCookie = {
  board: string;
  role: string;
  state: string;
  district: string;
  city: string;
  displayName?: string;
  mobile?: string;
  /** Server-issued id — present for tracked 1-day demo sessions */
  sessionId?: string;
  /** ISO timestamp — informational; server uses DB `expires_at` as source of truth */
  expiresAt?: string;
};

export function parseDemoCookie(raw: string | undefined): DemoContextCookie | null {
  if (!raw) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const board = typeof o.board === "string" ? o.board : "MATRIC";
    const role = typeof o.role === "string" ? o.role : "student";
    const state = typeof o.state === "string" ? o.state : "Tamil Nadu";
    const district = typeof o.district === "string" ? o.district : "India";
    const city = typeof o.city === "string" ? o.city : "Srivilliputhur";
    const displayName = typeof o.displayName === "string" ? o.displayName.trim() : undefined;
    const mobile = typeof o.mobile === "string" ? o.mobile.trim() : undefined;
    const sessionId = typeof o.sessionId === "string" ? o.sessionId.trim() : undefined;
    const expiresAt = typeof o.expiresAt === "string" ? o.expiresAt.trim() : undefined;
    return { board, role, state, district, city, displayName, mobile, sessionId, expiresAt };
  } catch {
    return null;
  }
}

export function buildSchoolChartsPayload(input: {
  studentCount: number;
  examCount: number;
  resultCount: number;
  recentMarks: number[];
  moduleRows: { title: string; attempts: number }[];
  openInterventionCount: number;
  overdueInterventionCount: number;
  completedInterventionCount: number;
  averageModuleScore: number | null;
  improvingCount: number;
  atRiskResultCount: number;
  moduleEventsForTrend: { createdAt: Date }[];
  now: Date;
}): DashboardChartsPayload {
  const activityTrend = buildActivityTrendFromModuleEvents(input.moduleEventsForTrend, input.now);
  const marksBands = buildMarksBandsFromMarks(input.recentMarks);
  const moduleAttempts = input.moduleRows.slice(0, 10).map((r) => ({
    name: r.title.length > 22 ? `${r.title.slice(0, 20)}…` : r.title,
    value: r.attempts,
  }));
  const overview: ChartBar[] = [
    { name: "Students", value: input.studentCount },
    { name: "Exams", value: input.examCount },
    { name: "Results", value: input.resultCount },
  ];
  const interventionPipeline: ChartBar[] = [
    { name: "Open", value: input.openInterventionCount },
    { name: "Overdue", value: input.overdueInterventionCount },
    { name: "Completed", value: input.completedInterventionCount },
  ];
  const roleInsight: ChartBar[] = [
    { name: "Avg module %", value: input.averageModuleScore ?? 0 },
    { name: "Improving modules", value: input.improvingCount },
    { name: "At-risk papers", value: input.atRiskResultCount },
  ];
  return {
    mode: "school",
    overview,
    marksBands,
    moduleAttempts,
    interventionPipeline,
    activityTrend,
    roleInsight,
  };
}

export function buildDemoChartsPayload(ctx: DemoContextCookie | null, role?: string, email?: string): DashboardChartsPayload {
  const seed = hashSeed([
    ctx?.board ?? "",
    ctx?.role ?? role ?? "",
    ctx?.state ?? "",
    ctx?.district ?? "",
    ctx?.city ?? "",
    ctx?.displayName ?? "",
    ctx?.mobile ?? "",
    email ?? "",
  ]);
  const mod = (n: number) => seed % n;

  const overview: ChartBar[] = [
    { name: "Students", value: 28 + mod(45) },
    { name: "Exams", value: 6 + mod(12) },
    { name: "Results", value: 120 + mod(80) },
    { name: "Modules", value: 8 + mod(8) },
  ];

  const marksBands: ChartBar[] = [
    { name: "0–39", value: 4 + mod(8) },
    { name: "40–59", value: 12 + mod(15) },
    { name: "60–79", value: 22 + mod(20) },
    { name: "80–100", value: 14 + mod(18) },
  ];

  const moduleAttempts: ChartBar[] = [
    { name: "Vedic Maths", value: 40 + mod(30) },
    { name: "Speed Tricks", value: 32 + mod(25) },
    { name: "Homework Helper", value: 55 + mod(40) },
    { name: "AI Study Planner", value: 28 + mod(22) },
    { name: "Memory Techniques", value: 18 + mod(20) },
    { name: "Weak Area Detection", value: 22 + mod(18) },
  ].sort((a, b) => b.value - a.value);

  const interventionPipeline: ChartBar[] = [
    { name: "Open", value: 5 + mod(8) },
    { name: "Overdue", value: 2 + mod(5) },
    { name: "Completed (30d)", value: 18 + mod(15) },
  ];

  const roleInsight: ChartBar[] = [
    { name: "Engagement", value: 55 + mod(35) },
    { name: "Completion", value: 48 + mod(40) },
    { name: "Challenge", value: 62 + mod(28) },
  ];

  const demoNow = new Date();
  const activityTrend: ChartBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(demoNow);
    d.setDate(d.getDate() - (6 - i));
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const value = 10 + mod(18 + i * 5);
    activityTrend.push({ name: label, value });
  }

  return {
    mode: "demo",
    overview,
    marksBands,
    moduleAttempts,
    interventionPipeline,
    activityTrend,
    roleInsight,
  };
}
