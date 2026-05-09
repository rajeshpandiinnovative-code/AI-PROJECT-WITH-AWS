export type ModuleIconKey =
  | "calculator"
  | "swords"
  | "brain"
  | "hand"
  | "graduation-cap"
  | "languages"
  | "chart-line"
  | "scan-search"
  | "layout-dashboard"
  | "message-square-text"
  | "mic"
  | "notebook-pen"
  | "sparkles"
  | "speech"
  | "code2"
  | "monitor-smartphone"
  | "wallet"
  | "badge-check"
  | "clock3";

export type LearningModule = {
  slug: string;
  title: string;
  description: string;
  outcome: string;
  iconKey: ModuleIconKey;
};

export type ModulePillar = {
  id: string;
  title: string;
  subtitle: string;
  accentClass: string;
  ringClass: string;
  modules: LearningModule[];
};

export const modulePillars: ModulePillar[] = [
  {
    id: "pillar-a",
    title: "Pillar A: Academic & Competitive Excellence",
    subtitle: "Build score, speed, and exam confidence at scale.",
    accentClass: "from-cyan-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-cyan-400/30",
    modules: [
      {
        slug: "vedic-maths",
        title: "Vedic Maths",
        description: "Fast mental arithmetic techniques.",
        outcome: "Students reduce solve-time in arithmetic-heavy sections.",
        iconKey: "calculator",
      },
      {
        slug: "speed-tricks",
        title: "Speed Tricks",
        description: "Timed methods for quick solving.",
        outcome: "Learners improve test pacing and question coverage.",
        iconKey: "swords",
      },
      {
        slug: "memory-techniques",
        title: "Memory Techniques",
        description: "Retention frameworks for recall.",
        outcome: "Students retain concepts longer with active retrieval.",
        iconKey: "brain",
      },
      {
        slug: "handwriting-improvement",
        title: "Handwriting Improvement",
        description: "Readable writing with structure.",
        outcome: "Cleaner presentation and better evaluator readability.",
        iconKey: "hand",
      },
      {
        slug: "neet-jee-daily-mcqs",
        title: "NEET/JEE Daily MCQs",
        description: "Practice with daily challenge sets.",
        outcome: "Daily consistency for competitive exam readiness.",
        iconKey: "graduation-cap",
      },
      {
        slug: "tnpsc-prep",
        title: "TNPSC Prep",
        description: "Localized preparation for Tamil Nadu exams.",
        outcome: "Focused prep flow for TNPSC aspirants.",
        iconKey: "languages",
      },
      {
        slug: "rank-predictor",
        title: "Rank Predictor",
        description: "Forecast rank from performance trends.",
        outcome: "Parents and schools see rank trajectory early.",
        iconKey: "chart-line",
      },
      {
        slug: "weak-area-detection",
        title: "Weak Area Detection",
        description: "Pinpoint topic-level performance gaps.",
        outcome: "Targeted revision plans based on weak topics.",
        iconKey: "scan-search",
      },
    ],
  },
  {
    id: "pillar-b",
    title: "Pillar B: The Viral AI Engine",
    subtitle: "The smart layer that drives retention and referrals.",
    accentClass: "from-emerald-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-emerald-400/30",
    modules: [
      {
        slug: "ai-study-planner",
        title: "AI Study Planner",
        description: "Adaptive weekly study plans.",
        outcome: "Automatic study roadmaps per learner pace.",
        iconKey: "layout-dashboard",
      },
      {
        slug: "homework-helper",
        title: "Homework Helper",
        description: "Step-by-step homework guidance.",
        outcome: "Reduced parent stress with instant help at home.",
        iconKey: "message-square-text",
      },
      {
        slug: "voice-tutor",
        title: "Voice Tutor",
        description: "Voice-based explanations in seconds.",
        outcome: "Conversational doubt solving in natural language.",
        iconKey: "mic",
      },
      {
        slug: "ai-notes-generator",
        title: "AI Notes Generator",
        description: "Auto-generated concise notes.",
        outcome: "Quick revision sheets after each topic.",
        iconKey: "notebook-pen",
      },
      {
        slug: "ai-quiz-generator",
        title: "AI Quiz Generator",
        description: "Instant quizzes by chapter or topic.",
        outcome: "Rapid practice loops with auto difficulty scaling.",
        iconKey: "sparkles",
      },
    ],
  },
  {
    id: "pillar-c",
    title: "Pillar C: Skill & Future Readiness",
    subtitle: "Beyond marks: communication, tech, and money skills.",
    accentClass: "from-violet-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-violet-400/30",
    modules: [
      {
        slug: "public-speaking",
        title: "Public Speaking",
        description: "Confidence-building speaking drills.",
        outcome: "Improved stage confidence and articulation.",
        iconKey: "speech",
      },
      {
        slug: "coding-for-kids",
        title: "Coding for Kids",
        description: "Beginner-friendly logic and coding tracks.",
        outcome: "Early computational thinking and creativity.",
        iconKey: "code2",
      },
      {
        slug: "robotics",
        title: "Robotics",
        description: "Hands-on STEM exploration modules.",
        outcome: "Practical problem-solving through build projects.",
        iconKey: "monitor-smartphone",
      },
      {
        slug: "financial-literacy",
        title: "Financial Literacy",
        description: "Budgeting, saving, and practical finance.",
        outcome: "Core money habits and responsible decision making.",
        iconKey: "wallet",
      },
    ],
  },
  {
    id: "pillar-d",
    title: "Pillar D: Wellness & Productivity",
    subtitle: "Sustainable performance through healthy routines.",
    accentClass: "from-teal-500/20 via-blue-500/10 to-slate-950",
    ringClass: "ring-teal-400/30",
    modules: [
      {
        slug: "focus-exercises",
        title: "Focus Exercises",
        description: "Daily concentration boosters.",
        outcome: "Higher attention span for study sessions.",
        iconKey: "brain",
      },
      {
        slug: "exam-stress-management",
        title: "Exam Stress Management",
        description: "Guided routines for calm preparation.",
        outcome: "Lower anxiety before and during examinations.",
        iconKey: "badge-check",
      },
      {
        slug: "habit-tracker",
        title: "Habit Tracker",
        description: "Track consistency and discipline streaks.",
        outcome: "Visible habit momentum for students and parents.",
        iconKey: "clock3",
      },
      {
        slug: "screen-time-monitor",
        title: "Screen Time Monitor",
        description: "Balanced digital learning windows.",
        outcome: "Healthy study-screen balance with clear limits.",
        iconKey: "monitor-smartphone",
      },
    ],
  },
];

export const allModules: LearningModule[] = modulePillars.flatMap((pillar) => pillar.modules);

export function getModuleBySlug(slug: string): LearningModule | undefined {
  return allModules.find((module) => module.slug === slug);
}
