/**
 * BehaviorEngine — Proactive Nudge & Idle Detection system.
 * Triggers context-aware tooltips based on module state and user inactivity.
 * 100% client-side, zero API calls.
 */

export type NudgeType = "idle" | "welcome" | "stuck" | "milestone";

export type NudgeTrigger = {
  type: NudgeType;
  message: string;
  delay: number;
  actionLabel?: string;
  actionSlug?: string;
};

const MODULE_NUDGES: Record<string, NudgeTrigger[]> = {
  "vedic-maths": [
    {
      type: "idle",
      delay: 5000,
      message: "Want to try a 5-second lightning challenge?",
      actionLabel: "Start Challenge",
    },
    {
      type: "welcome",
      delay: 1000,
      message: "Welcome to Vedic Maths! Master mental arithmetic with ancient Indian techniques.",
    },
  ],
  "handwriting-improvement": [
    {
      type: "welcome",
      delay: 1200,
      message: "Ready to scan your first sheet? I'm calibrated for CBSE cursive standards.",
      actionLabel: "Begin Scan",
    },
    {
      type: "idle",
      delay: 8000,
      message: "Try writing one paragraph with uniform spacing. I can grade your consistency.",
    },
  ],
  "speed-tricks": [
    {
      type: "welcome",
      delay: 1000,
      message: "Speed is a learnable skill. Let's start with timed drills under controlled pressure.",
    },
    {
      type: "idle",
      delay: 6000,
      message: "Set a 2-minute timer and solve 5 problems. Shall I generate a set?",
      actionLabel: "Generate Set",
    },
  ],
  "memory-techniques": [
    {
      type: "welcome",
      delay: 1000,
      message: "Memory is trained, not born. Let's build your first memory palace.",
    },
    {
      type: "idle",
      delay: 7000,
      message: "Quick recall test: Can you list 3 facts from your last chapter without notes?",
      actionLabel: "Try Recall",
    },
  ],
  "neet-jee-daily-mcqs": [
    {
      type: "welcome",
      delay: 1000,
      message: "Your daily MCQ set is ready. Consistency beats intensity for competitive exams.",
    },
    {
      type: "idle",
      delay: 6000,
      message: "You haven't attempted today's set yet. 15 MCQs, 20 minutes — ready?",
      actionLabel: "Start MCQs",
    },
  ],
  "tnpsc-prep": [
    {
      type: "welcome",
      delay: 1000,
      message: "TNPSC prep requires current affairs + static facts. Let's connect them.",
    },
  ],
  "rank-predictor": [
    {
      type: "welcome",
      delay: 1000,
      message: "Enter your last 3 test scores and I'll project your rank trajectory.",
    },
  ],
  "weak-area-detection": [
    {
      type: "welcome",
      delay: 1000,
      message: "Let's pinpoint exactly which topics need repair. Targeted fixes beat random revision.",
    },
  ],
  "ai-study-planner": [
    {
      type: "welcome",
      delay: 1000,
      message: "I'll create a revision-balanced weekly plan based on your class and exam goals.",
    },
    {
      type: "idle",
      delay: 8000,
      message: "Not sure where to start? Select your class and goal — I'll handle the rest.",
      actionLabel: "Quick Setup",
    },
  ],
  "homework-helper": [
    {
      type: "welcome",
      delay: 1000,
      message: "Paste your homework question. I'll break it into guided steps, not just answers.",
    },
    {
      type: "idle",
      delay: 7000,
      message: "Stuck on a problem? Type it in and I'll walk you through the CBSE method.",
      actionLabel: "Ask Now",
    },
  ],
  "voice-tutor": [
    {
      type: "welcome",
      delay: 1000,
      message: "Speak your doubt aloud. Voice-based learning strengthens concept clarity.",
    },
  ],
  "ai-notes-generator": [
    {
      type: "welcome",
      delay: 1000,
      message: "Enter a topic and I'll generate concise revision notes in exam format.",
    },
  ],
  "ai-quiz-generator": [
    {
      type: "welcome",
      delay: 1000,
      message: "Custom quizzes generated instantly. Choose your topic, difficulty, and count.",
    },
    {
      type: "idle",
      delay: 6000,
      message: "Try a quick 5-question quiz on your weakest topic. Adaptive difficulty adjusts to you.",
      actionLabel: "Quick Quiz",
    },
  ],
  "public-speaking": [
    {
      type: "welcome",
      delay: 1000,
      message: "Record a 2-minute speech on any topic. Confidence is built through practice.",
    },
  ],
  "coding-for-kids": [
    {
      type: "welcome",
      delay: 1000,
      message: "Let's think like a computer! Break any daily task into step-by-step instructions.",
    },
    {
      type: "idle",
      delay: 7000,
      message: "Try writing pseudo-code for making tea. It's simpler than you think!",
      actionLabel: "Try It",
    },
  ],
  robotics: [
    {
      type: "welcome",
      delay: 1000,
      message: "Design input-process-output flows for real robots. Start with a sensor challenge.",
    },
  ],
  "financial-literacy": [
    {
      type: "welcome",
      delay: 1000,
      message: "Create your first 7-day budget. Track needs vs wants — the foundation of money skills.",
    },
  ],
  "focus-exercises": [
    {
      type: "welcome",
      delay: 1000,
      message: "Two 25-minute focus blocks can change your study game. Let's start your first one.",
    },
    {
      type: "idle",
      delay: 10000,
      message: "Your attention wandered — that's normal! Try a 5-minute deep focus sprint right now.",
      actionLabel: "Start Sprint",
    },
  ],
  "exam-stress-management": [
    {
      type: "welcome",
      delay: 1000,
      message: "Exam anxiety is manageable. Let's start with the 4-7-8 breathing technique.",
    },
  ],
  "habit-tracker": [
    {
      type: "welcome",
      delay: 1000,
      message: "Pick 3 daily habits to track. Small consistent actions compound into big results.",
    },
  ],
  "screen-time-monitor": [
    {
      type: "welcome",
      delay: 1000,
      message: "Set intentional screen slots for study vs leisure. Balance is key to sustained learning.",
    },
  ],
};

export type BehaviorEngineState = {
  currentNudge: NudgeTrigger | null;
  dismissed: boolean;
  idleMs: number;
};

export function getNudgesForModule(slug: string): NudgeTrigger[] {
  return MODULE_NUDGES[slug] ?? [
    {
      type: "welcome",
      delay: 1200,
      message: "Welcome to this module. Explore Learn, Practice, and Challenge tabs to build mastery.",
    },
  ];
}

export function getWelcomeNudge(slug: string): NudgeTrigger | null {
  const nudges = getNudgesForModule(slug);
  return nudges.find((n) => n.type === "welcome") ?? null;
}

export function getIdleNudge(slug: string): NudgeTrigger | null {
  const nudges = getNudgesForModule(slug);
  return nudges.find((n) => n.type === "idle") ?? null;
}

export const ACTION_CHIPS: Record<string, { label: string; prompt: string }[]> = {
  "vedic-maths": [
    { label: "Explain Base Method", prompt: "Explain the Nikhilam base method for multiplication near 100." },
    { label: "5-Second Challenge", prompt: "Give me a quick 5-second mental math challenge." },
    { label: "Show Shortcuts", prompt: "List the top 3 Vedic Maths shortcuts for Class 10 board exams." },
  ],
  "handwriting-improvement": [
    { label: "CBSE Standards", prompt: "What are the CBSE handwriting evaluation criteria?" },
    { label: "Spacing Tips", prompt: "How do I improve letter spacing in cursive writing?" },
    { label: "Practice Sheet", prompt: "Generate a practice paragraph for uniform handwriting." },
  ],
  "speed-tricks": [
    { label: "Quick Multiply", prompt: "Teach me the fastest way to multiply two-digit numbers." },
    { label: "Time Saver", prompt: "What are 3 time-saving tricks for board exam maths?" },
    { label: "Accuracy Check", prompt: "How do I verify answers quickly without recalculating?" },
  ],
  "memory-techniques": [
    { label: "Memory Palace", prompt: "Walk me through creating a memory palace for biology terms." },
    { label: "Chunking Method", prompt: "Explain the chunking technique for memorizing formulas." },
    { label: "Spaced Recall", prompt: "Create a spaced repetition schedule for this week." },
  ],
  "neet-jee-daily-mcqs": [
    { label: "Today's Set", prompt: "Generate 5 NEET-style MCQs on the current topic." },
    { label: "Error Analysis", prompt: "Analyse my common mistakes in MCQ practice." },
    { label: "Strategy Tips", prompt: "What is the best MCQ elimination strategy for JEE?" },
  ],
  "ai-study-planner": [
    { label: "Quick Plan", prompt: "Create a 7-day study plan for Class 10 board exams." },
    { label: "Weak Focus", prompt: "How should I allocate extra time to my weakest subjects?" },
    { label: "Exam Mode", prompt: "Switch my plan to intensive exam preparation mode." },
  ],
  "homework-helper": [
    { label: "Step-by-Step", prompt: "Break down this problem into guided steps." },
    { label: "Similar Problem", prompt: "Show me a similar practice problem with hints." },
    { label: "Concept Map", prompt: "Create a concept map linking this topic to related ideas." },
  ],
  "ai-quiz-generator": [
    { label: "Quick 5", prompt: "Generate 5 quick MCQs on my current topic." },
    { label: "Hard Mode", prompt: "Generate advanced-difficulty questions to push my limits." },
    { label: "Review Mistakes", prompt: "Create questions targeting my previous wrong answers." },
  ],
  "ai-notes-generator": [
    { label: "Exam Notes", prompt: "Generate board-exam style revision notes for this topic." },
    { label: "One-Pager", prompt: "Condense everything into a single-page summary." },
    { label: "Formula Sheet", prompt: "Extract all formulas and key definitions." },
  ],
  "coding-for-kids": [
    { label: "First Program", prompt: "Help me write my first pseudo-code program." },
    { label: "Logic Puzzle", prompt: "Give me a fun logic puzzle to solve step by step." },
    { label: "Debug This", prompt: "Here's my code — can you find the bug?" },
  ],
  "focus-exercises": [
    { label: "Pomodoro", prompt: "Start a 25-minute Pomodoro focus session." },
    { label: "Deep Work", prompt: "How do I enter a deep work state for studying?" },
    { label: "Distraction Log", prompt: "Help me create a distraction log for today." },
  ],
  "exam-stress-management": [
    { label: "Breathe 4-7-8", prompt: "Guide me through the 4-7-8 breathing exercise." },
    { label: "Pre-Exam Ritual", prompt: "Create a calming pre-exam morning routine." },
    { label: "Positive Cues", prompt: "Replace my anxious thoughts with performance cues." },
  ],
};

export function getActionChips(slug: string): { label: string; prompt: string }[] {
  return ACTION_CHIPS[slug] ?? [
    { label: "Get Started", prompt: "How should I begin with this module?" },
    { label: "Best Practice", prompt: "What is the most effective way to use this module?" },
    { label: "Quick Tip", prompt: "Give me one actionable tip for today's session." },
  ];
}

export type StuckNudge = {
  message: string;
  whatsappAction: boolean;
  retryLabel: string;
};

const STUCK_NUDGES: Record<string, StuckNudge> = {
  "vedic-maths": {
    message: "Vedic Maths can be tricky! Tap here to get a quick tip from a Pinnacle Expert via WhatsApp.",
    whatsappAction: true,
    retryLabel: "Retry with Hints",
  },
  "speed-tricks": {
    message: "Speed takes practice. Want a personalised strategy from our team?",
    whatsappAction: true,
    retryLabel: "Try Easier Set",
  },
  "neet-jee-daily-mcqs": {
    message: "Competitive MCQs are designed to challenge. Let a Pinnacle mentor guide your revision.",
    whatsappAction: true,
    retryLabel: "Review Answers",
  },
};

export function getStuckNudge(slug: string): StuckNudge {
  return STUCK_NUDGES[slug] ?? {
    message: "That was a tough round. Every expert was once a beginner. Tap below for personalised guidance from Pinnacle.",
    whatsappAction: true,
    retryLabel: "Try Again",
  };
}
