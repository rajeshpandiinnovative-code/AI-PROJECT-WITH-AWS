/**
 * MockDataEngine — Ghost Mode simulation layer.
 * Provides deterministic mock data when AWS RDS is stopped.
 * All functions are client-safe (no server imports).
 */

import type {
  MockStudentRecord,
  HandwritingOCRResult,
  VedicMathDrill,
  VedicDrillResult,
  MockDatabaseStats,
  PillarStat,
} from "@/src/types/modules";

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Ananya", "Diya", "Myra", "Sara", "Aadhya", "Isha", "Kavya", "Riya", "Priya", "Neha",
  "Rohan", "Kabir", "Shaurya", "Atharv", "Advik", "Rudra", "Dhruv", "Arnav", "Krish", "Yash",
  "Tanvi", "Nisha", "Pooja", "Shreya", "Zara", "Anika", "Kiara", "Mira", "Tara", "Ira",
  "Manav", "Dev", "Raj", "Om", "Neil", "Kunal", "Aman", "Jay", "Karthik", "Siddharth",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Kumar", "Singh", "Gupta", "Reddy", "Nair", "Iyer", "Pillai",
  "Joshi", "Mishra", "Pandey", "Rao", "Das", "Bhat", "Menon", "Chopra", "Kapoor", "Shah",
  "Mehta", "Agarwal", "Deshmukh", "Kulkarni", "Patil", "Naidu", "Rajan", "Thomas", "George", "Mathew",
];

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Social Science", "Computer Science", "Sanskrit", "Environmental Science",
];

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockStudents(count: number = 1500): MockStudentRecord[] {
  const rng = seededRandom(42);
  const students: MockStudentRecord[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const grade = GRADES[Math.floor(rng() * GRADES.length)];
    const section = SECTIONS[Math.floor(rng() * SECTIONS.length)];
    const avgScore = Math.round(40 + rng() * 55);
    const attendance = Math.round(65 + rng() * 35);

    const shuffled = [...SUBJECTS].sort(() => rng() - 0.5);
    const weakCount = 1 + Math.floor(rng() * 3);
    const strongCount = 1 + Math.floor(rng() * 3);

    const daysAgo = Math.floor(rng() * 14);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);

    students.push({
      id: `stu-${String(i + 1).padStart(5, "0")}`,
      name: `${firstName} ${lastName}`,
      rollNo: i + 1,
      grade,
      section,
      avgScore,
      attendance,
      weakSubjects: shuffled.slice(0, weakCount),
      strongSubjects: shuffled.slice(weakCount, weakCount + strongCount),
      lastActive: d.toISOString().split("T")[0],
    });
  }

  return students;
}

const VEDIC_TECHNIQUES = [
  { name: "Nikhilam (Base Method)", op: "multiply" as const },
  { name: "Urdhva Tiryak (Crosswise)", op: "multiply" as const },
  { name: "Ekadhikena (Squaring)", op: "square" as const },
  { name: "Paravartya (Transpose)", op: "subtract" as const },
  { name: "Sunyam Samyasamuccaye", op: "add" as const },
];

export function generateVedicDrills(count: number = 10, level: "beginner" | "intermediate" | "advanced" = "beginner"): VedicMathDrill[] {
  const rng = seededRandom(Date.now() % 10000);
  const drills: VedicMathDrill[] = [];
  const ranges = { beginner: [10, 50], intermediate: [50, 200], advanced: [200, 999] } as const;
  const [lo, hi] = ranges[level];

  for (let i = 0; i < count; i++) {
    const tech = VEDIC_TECHNIQUES[Math.floor(rng() * VEDIC_TECHNIQUES.length)];
    const a = Math.round(lo + rng() * (hi - lo));
    const b = tech.op === "square" ? a : Math.round(lo + rng() * (hi - lo));

    let correctAnswer: number;
    switch (tech.op) {
      case "multiply": correctAnswer = a * b; break;
      case "add": correctAnswer = a + b; break;
      case "subtract": correctAnswer = Math.abs(a - b); break;
      case "square": correctAnswer = a * a; break;
    }

    drills.push({
      id: i + 1,
      operandA: a,
      operandB: b,
      operation: tech.op,
      correctAnswer,
      technique: tech.name,
      hint: `Apply ${tech.name}: find complements to nearest base of 10/100.`,
    });
  }

  return drills;
}

export function evaluateVedicDrill(
  drills: VedicMathDrill[],
  answers: Record<number, number>,
  totalTimeMs: number,
): VedicDrillResult {
  let correct = 0;
  for (const drill of drills) {
    if (answers[drill.id] === drill.correctAnswer) correct++;
  }
  return {
    totalQuestions: drills.length,
    correct,
    wrong: drills.length - correct,
    avgTimePerQuestion: Math.round(totalTimeMs / drills.length / 1000),
    score: Math.round((correct / drills.length) * 100),
  };
}

const LEGIBILITY_TIERS: HandwritingOCRResult["legibility"][] = [
  "excellent", "good", "good", "fair", "fair", "needs-improvement",
];

export async function simulateHandwritingOCR(): Promise<HandwritingOCRResult> {
  await new Promise((r) => setTimeout(r, 2000));

  const rng = seededRandom(Date.now() % 99999);
  const score = Math.round(55 + rng() * 40);
  const legibility = score >= 90
    ? "excellent"
    : score >= 75
      ? "good"
      : score >= 60
        ? "fair"
        : "needs-improvement";

  const feedback: string[] = [];
  if (score < 70) feedback.push("Letter spacing could be more uniform.");
  if (score < 80) feedback.push("Some characters overlap — try wider margins.");
  if (score >= 80) feedback.push("Clean baseline alignment detected.");
  if (score >= 90) feedback.push("Excellent consistency across all lines.");
  feedback.push("Practice cursive joins for smoother flow.");

  return {
    score,
    legibility,
    spacing: Math.round(50 + rng() * 50),
    consistency: Math.round(50 + rng() * 50),
    feedback,
    processingTimeMs: 2000,
  };
}

export function getMockDatabaseStats(): MockDatabaseStats {
  const students = generateMockStudents(1500);
  const gradeDistribution: Record<string, number> = {};
  for (const s of students) {
    gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
  }

  const activeToday = students.filter((s) => s.lastActive === new Date().toISOString().split("T")[0]).length;
  const avgScore = Math.round(students.reduce((a, b) => a + b.avgScore, 0) / students.length);

  return {
    totalStudents: 1500,
    activeToday: activeToday || Math.round(150 + Math.random() * 200),
    avgPlatformScore: avgScore,
    topModules: [
      { slug: "vedic-maths", title: "Vedic Maths", sessions: 1247 },
      { slug: "ai-quiz-generator", title: "AI Quiz Generator", sessions: 1089 },
      { slug: "homework-helper", title: "Homework Helper", sessions: 982 },
      { slug: "coding-for-kids", title: "Coding for Kids", sessions: 876 },
      { slug: "ai-study-planner", title: "AI Study Planner", sessions: 754 },
    ],
    gradeDistribution,
  };
}

export function getMockPillarStats(): PillarStat[] {
  return [
    { pillarId: "pillar-a", totalSessions: 4820, avgScore: 74, topModule: "Vedic Maths" },
    { pillarId: "pillar-b", totalSessions: 3654, avgScore: 81, topModule: "AI Quiz Generator" },
    { pillarId: "pillar-c", totalSessions: 2190, avgScore: 69, topModule: "Coding for Kids" },
    { pillarId: "pillar-d", totalSessions: 1780, avgScore: 77, topModule: "Habit Tracker" },
  ];
}
