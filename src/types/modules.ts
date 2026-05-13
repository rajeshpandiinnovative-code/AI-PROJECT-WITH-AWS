/**
 * Ghost Mode type definitions for the AI Academy Pro module system.
 * Re-exports core types from src/lib/modules.ts and adds Ghost Mode specifics.
 */

export type { ModuleIconKey, LearningModule, ModulePillar } from "@/src/lib/modules";

export type GhostModuleStatus = "available" | "coming-soon" | "locked";

export type MockStudentRecord = {
  id: string;
  name: string;
  rollNo: number;
  grade: string;
  section: string;
  avgScore: number;
  attendance: number;
  weakSubjects: string[];
  strongSubjects: string[];
  lastActive: string;
};

export type HandwritingOCRResult = {
  score: number;
  legibility: "excellent" | "good" | "fair" | "needs-improvement";
  spacing: number;
  consistency: number;
  feedback: string[];
  processingTimeMs: number;
};

export type VedicMathDrill = {
  id: number;
  operandA: number;
  operandB: number;
  operation: "multiply" | "add" | "subtract" | "square";
  correctAnswer: number;
  technique: string;
  hint: string;
};

export type VedicDrillResult = {
  totalQuestions: number;
  correct: number;
  wrong: number;
  avgTimePerQuestion: number;
  score: number;
};

export type MockDatabaseStats = {
  totalStudents: number;
  activeToday: number;
  avgPlatformScore: number;
  topModules: { slug: string; title: string; sessions: number }[];
  gradeDistribution: Record<string, number>;
};

export type PillarStat = {
  pillarId: string;
  totalSessions: number;
  avgScore: number;
  topModule: string;
};
