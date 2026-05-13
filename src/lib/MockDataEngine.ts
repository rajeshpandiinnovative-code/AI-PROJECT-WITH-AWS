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

  return {
    totalStudents: 1500,
    activeToday: 101,
    avgPlatformScore: Math.round(students.reduce((a, b) => a + b.avgScore, 0) / students.length),
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

export type LocalSocialProof = {
  localActive: string;
  recentHighScore: string;
  institution: string;
};

/* ─────────────────────────────────────────────────────────
 *  UNIVERSAL LEARNING ADAPTER
 *  Grade-aware pedagogy for any tech topic
 * ───────────────────────────────────────────────────────── */

export type PedagogyLevel = "foundation" | "builder" | "master";

export function gradeToPedagogy(grade: number | string): PedagogyLevel {
  const g = typeof grade === "string" ? parseInt(grade.replace(/\D/g, ""), 10) : grade;
  if (g <= 5) return "foundation";
  if (g <= 8) return "builder";
  return "master";
}

type TopicCurriculum = {
  foundation: { title: string; intro: string; lesson: string; activity: string };
  builder:    { title: string; intro: string; lesson: string; activity: string };
  master:     { title: string; intro: string; lesson: string; activity: string };
};

const TOPIC_CURRICULA: Record<string, TopicCurriculum> = {
  deepseek: {
    foundation: {
      title: "Talking to Robots — Your First AI Chat!",
      intro: "Imagine you have a super-smart robot friend. You talk to it by typing words — these words are called 'prompts.' The better your magic spell (prompt), the better the robot's answer!",
      lesson: "Activity: The Magic Spell Game\n\n1. Think of something you want to know (e.g., 'Tell me a story about a brave parrot').\n2. Type it clearly — this is your Magic Spell.\n3. The robot reads your spell and creates an answer!\n\nTip: Short, clear spells work best. Instead of 'stuff about animals,' try 'Tell me 3 fun facts about elephants.'\n\nThink of prompts like giving directions to a friend — the clearer you are, the better they understand!",
      activity: "Write 3 Magic Spells (prompts) and guess what the robot might say. Draw your favourite robot answer!",
    },
    builder: {
      title: "Prompt Engineering Basics — How AI Reads Your Instructions",
      intro: "DeepSeek and similar AI models process your input (prompt) and generate output based on patterns learned from vast datasets. The structure and clarity of your prompt directly affects output quality.",
      lesson: "Key Concepts:\n\n1. Context Setting: Tell the AI who it should act as.\n   Example: 'You are a Class 8 Science tutor. Explain photosynthesis.'\n\n2. Specificity: Vague prompts produce vague answers.\n   Bad: 'Tell me about space.'\n   Good: 'List 5 differences between planets and stars in a table format.'\n\n3. Output Format: Specify how you want the answer.\n   'Explain in bullet points' vs 'Write a 200-word essay' yield different responses.\n\n4. Iteration: Refine your prompt based on the first response.",
      activity: "Write a prompt that asks DeepSeek to create a study plan for your weakest subject. Compare results when you add context (your class, exam date, daily hours) vs when you leave it vague.",
    },
    master: {
      title: "Prompt Engineering Framework — Advanced Techniques for DeepSeek",
      intro: "At this level, you are not merely using AI — you are engineering interactions. Prompt engineering is the discipline of crafting inputs that maximise the quality, relevance, and precision of AI-generated outputs.",
      lesson: "Advanced Prompt Engineering Techniques:\n\n1. Zero-Shot Prompting\n   Direct instruction without examples. Effective for straightforward tasks.\n   Example: 'Summarise the causes of World War I in 5 bullet points.'\n\n2. Few-Shot Prompting\n   Provide 2-3 examples so the model learns the pattern.\n   Example: 'Q: What is 2+2? A: 4. Q: What is 5×3? A: 15. Q: What is 12÷4? A: ?'\n\n3. Chain-of-Thought (CoT) Prompting\n   Ask the model to reason step-by-step before answering.\n   Example: 'Solve this problem step-by-step: A train travels 120 km in 2 hours...'\n\n4. Role-Based Prompting\n   'Act as a senior data analyst. Review this dataset and identify anomalies.'\n\n5. Constraint Engineering\n   Set guardrails: word limits, format, tone, audience level.\n   'Explain quantum entanglement in exactly 3 sentences for a physics undergraduate.'",
      activity: "Design a prompt chain: (1) Generate a physics problem, (2) Solve it with CoT, (3) Create a marking rubric. Compare zero-shot vs few-shot accuracy.",
    },
  },
  canva: {
    foundation: {
      title: "Canva: Your Digital Colouring Book!",
      intro: "Canva is like a giant box of digital crayons, stickers, and shapes. You drag and drop things to make posters, birthday cards, and school projects — no drawing skills needed!",
      lesson: "Let's Make a Poster:\n\n1. Pick a Template — it's like choosing a colouring page.\n2. Change the Text — click on words and type your own.\n3. Add Stickers — drag fun images from the side panel.\n4. Pick Colours — tap any shape and choose your favourite colour.\n\nRemember: Big text at the top, a picture in the middle, and details at the bottom. That's the 'Poster Formula'!",
      activity: "Design a 'My Favourite Animal' poster using Canva. Use at least 2 images, 1 heading, and 3 colours.",
    },
    builder: {
      title: "Canva Design Principles — Layout, Typography, and Visual Hierarchy",
      intro: "Good design is not about decoration — it's about communication. Learn how alignment, contrast, and whitespace guide the viewer's eye through your creation.",
      lesson: "Core Design Principles in Canva:\n\n1. Alignment: Keep elements snapped to invisible grid lines.\n2. Contrast: Dark text on light backgrounds (or vice versa) for readability.\n3. Hierarchy: Headings > Subheadings > Body text (size descending).\n4. Whitespace: Empty space is not wasted — it lets the design breathe.\n5. Consistency: Same fonts, same colour palette across all pages.\n\nLayering: Use 'Position > Forward/Backward' to control which elements appear on top.",
      activity: "Redesign your school timetable in Canva using proper alignment, a 3-colour palette, and clear hierarchy. Export as PDF.",
    },
    master: {
      title: "Brand Identity & Visual Communication — Professional Canva Workflows",
      intro: "At the professional level, Canva becomes a brand management tool. You will learn to create brand kits, maintain visual consistency across collateral, and design for specific communication objectives.",
      lesson: "Professional Design Workflow:\n\n1. Brand Kit Setup: Define primary/secondary colours, fonts, logos.\n2. Template Systems: Create reusable templates for social media, presentations, reports.\n3. Design for Intent: Informational (clean, structured) vs Persuasive (bold, emotional).\n4. Accessibility: Sufficient colour contrast (WCAG AA), alt-text for images.\n5. Export Optimisation: PNG for web, PDF for print, SVG for scalable assets.\n\nAdvanced: Use Canva's Magic Resize to adapt one design across Instagram, LinkedIn, and A4 print simultaneously.",
      activity: "Create a complete brand kit for a fictional startup: logo, colour palette, 2 social media templates, and a presentation template. Present the rationale behind each design choice.",
    },
  },
  scratch: {
    foundation: {
      title: "Scratch: Build Your Own Cartoon Game!",
      intro: "Scratch is like building with Lego blocks — but for making games, stories, and animations on your computer! You snap colourful blocks together, and your character comes to life.",
      lesson: "Your First Scratch Project:\n\n1. Pick a Sprite — that's your character (a cat, a dinosaur, or draw your own!).\n2. Snap Blocks Together:\n   • 'When green flag clicked' → this starts your game.\n   • 'Move 10 steps' → your sprite walks forward.\n   • 'Say Hello!' → your sprite talks!\n3. Add a Loop: Wrap blocks in 'Forever' to make things repeat.\n\nThink of it like giving instructions to a pet: 'Walk forward, turn around, walk back, repeat!'",
      activity: "Make a sprite walk across the screen and say 'Hello, AI Academy!' when it reaches the other side.",
    },
    builder: {
      title: "Scratch Programming — Variables, Conditionals, and Game Logic",
      intro: "Now that you know the blocks, it's time to think like a programmer. Variables store information, conditionals make decisions, and loops create repetition.",
      lesson: "Programming Concepts in Scratch:\n\n1. Variables: Create a 'Score' variable. Use 'Change Score by 1' when something happens.\n2. Conditionals: 'If touching colour red, then lose a life.'\n3. Broadcasts: Send messages between sprites to coordinate actions.\n4. Cloning: Create copies of sprites for enemies or collectibles.\n5. User Input: 'Ask what is your name?' and store the answer.\n\nDebugging: If your game doesn't work, check block order and variable names first.",
      activity: "Build a 'Catch the Falling Apples' game with a score counter, 3 lives, and increasing speed.",
    },
    master: {
      title: "Computational Thinking & Algorithm Design via Scratch",
      intro: "Scratch is a stepping stone to professional programming. At this level, focus on algorithmic efficiency, data structures (lists), and clean code architecture.",
      lesson: "Advanced Scratch Techniques:\n\n1. Lists as Arrays: Store high scores, inventory items, or quiz questions in Scratch lists.\n2. Sorting Algorithms: Implement bubble sort visually using sprite positions.\n3. State Machines: Use variables to track game states (menu, playing, paused, game-over).\n4. Modular Design: Use custom blocks (functions) to avoid code duplication.\n5. Optimisation: Reduce sprite count, use efficient collision detection.\n\nTransition to Python: Every Scratch block has a Python equivalent. 'If-then' → if/else, 'Repeat' → for/while loops.",
      activity: "Build a quiz engine in Scratch that reads questions from a list, tracks score, shows a timer, and displays a grade at the end. Then write the pseudo-code equivalent.",
    },
  },
  python: {
    foundation: {
      title: "Python: Teaching Your Computer to Talk!",
      intro: "Python is a language your computer understands. When you type special words, the computer does exactly what you say — like training a very obedient pet!",
      lesson: "Your First Python Spell:\n\nType this:\n  print('Hello, my name is Aarav!')\n\nThe computer reads 'print' and shows your message on screen. That's it — you just wrote code!\n\nMore spells:\n  print(5 + 3)       → Computer says: 8\n  print('🎉' * 5)    → Computer says: 🎉🎉🎉🎉🎉\n\nRemember: Python is case-sensitive. 'Print' won't work — it must be 'print' (all lowercase).",
      activity: "Write 3 print statements: your name, your favourite number doubled, and a row of your favourite emoji.",
    },
    builder: {
      title: "Python Fundamentals — Variables, Loops, and Functions",
      intro: "Python is the world's most popular programming language for a reason: clean syntax, powerful libraries, and massive community support. Time to build real programs.",
      lesson: "Core Python Concepts:\n\n1. Variables: name = 'Priya', age = 14, score = 92.5\n2. Input: answer = input('What is your name? ')\n3. Conditionals:\n   if score >= 70:\n       print('Pass!')\n   else:\n       print('Keep practising.')\n4. Loops:\n   for i in range(5):\n       print(f'Attempt {i+1}')\n5. Functions:\n   def greet(name):\n       return f'Hello, {name}!'\n\nDebugging: Read error messages carefully — Python tells you the exact line number.",
      activity: "Write a program that asks for 5 test scores, calculates the average, and prints 'Pass' if average >= 70.",
    },
    master: {
      title: "Clean Code & Software Engineering Principles in Python",
      intro: "Writing code that works is step one. Writing code that is readable, maintainable, and efficient is the mark of a professional engineer.",
      lesson: "Professional Python Practices:\n\n1. PEP 8 Style Guide: 4-space indentation, snake_case naming, 79-char line limit.\n2. Type Hints: def calculate_area(radius: float) -> float:\n3. List Comprehensions: squares = [x**2 for x in range(10)]\n4. Error Handling:\n   try:\n       result = 10 / divisor\n   except ZeroDivisionError:\n       print('Cannot divide by zero.')\n5. OOP Basics: Classes encapsulate data + behaviour.\n   class Student:\n       def __init__(self, name, grade):\n           self.name = name\n           self.grade = grade\n\nOptimisation: Use generators for large datasets. Profile with cProfile.",
      activity: "Build a Student Grade Manager: a class that stores students, calculates class average, identifies toppers, and exports results to a text file.",
    },
  },
};

const GENERIC_CURRICULUM: TopicCurriculum = {
  foundation: {
    title: "Exploring New Ideas — A Fun Introduction!",
    intro: "Every big idea starts with curiosity. Let's explore this topic using simple words, fun examples, and hands-on activities!",
    lesson: "How to Learn Something New:\n\n1. Ask 'What is it?' — Understand the basic idea in one sentence.\n2. Ask 'What does it look like?' — Find a picture or example.\n3. Ask 'Can I try it?' — Do a small activity to test your understanding.\n\nRemember: There are no silly questions. Every expert started as a beginner!",
    activity: "Draw or write 3 things you already know about this topic, and 3 things you want to find out.",
  },
  builder: {
    title: "Building Knowledge — Concepts and Application",
    intro: "You already know the basics. Now it's time to understand how things work under the surface and apply that knowledge to real problems.",
    lesson: "Learning Framework:\n\n1. Concept: What is the core principle?\n2. Mechanism: How does it work step by step?\n3. Application: Where is it used in the real world?\n4. Practice: Solve 2-3 problems to test your understanding.\n5. Reflect: What was easy? What needs more work?",
    activity: "Pick one concept from this topic. Explain it in your own words, give one real-world example, and create one practice question for a classmate.",
  },
  master: {
    title: "Advanced Mastery — Optimisation and Professional Practice",
    intro: "At this level, you move from understanding to optimising. Focus on efficiency, edge cases, and real-world application under constraints.",
    lesson: "Mastery Checklist:\n\n1. Can you explain this concept to a beginner clearly?\n2. Can you identify common mistakes and misconceptions?\n3. Can you apply it to a novel problem you haven't seen before?\n4. Can you evaluate multiple approaches and choose the most efficient?\n5. Can you teach it in a structured 5-minute presentation?",
    activity: "Design a mini-project that demonstrates mastery of this topic. Include: problem statement, approach, solution, and a self-evaluation rubric.",
  },
};

export type AdaptiveLesson = {
  level: PedagogyLevel;
  gradeLabel: string;
  title: string;
  intro: string;
  lesson: string;
  activity: string;
  signature: string;
};

export function generateAdaptiveLesson(topic: string, grade: number | string): AdaptiveLesson {
  const level = gradeToPedagogy(grade);
  const g = typeof grade === "string" ? parseInt(grade.replace(/\D/g, ""), 10) : grade;
  const key = topic.toLowerCase().replace(/[^a-z0-9]/g, "");
  const curriculum = TOPIC_CURRICULA[key] ?? GENERIC_CURRICULUM;
  const tier = curriculum[level];
  const gradeLabels: Record<PedagogyLevel, string> = {
    foundation: `Foundation (Std ${g}, Grades 3-5)`,
    builder: `Builder (Std ${g}, Grades 6-8)`,
    master: `Master (Std ${g}, Grades 9-12)`,
  };

  return {
    level,
    gradeLabel: gradeLabels[level],
    title: tier.title,
    intro: tier.intro,
    lesson: tier.lesson,
    activity: tier.activity,
    signature: "Powered by Pinnacle Software Solution | Mastery Verified.",
  };
}

export function formatAdaptiveLessonAsText(lesson: AdaptiveLesson): string {
  return [
    `📘 ${lesson.title}`,
    `Level: ${lesson.gradeLabel}`,
    "",
    lesson.intro,
    "",
    lesson.lesson,
    "",
    `✏️ Activity:\n${lesson.activity}`,
    "",
    lesson.signature,
    "Need help? WhatsApp 9535761292",
  ].join("\n");
}

/* ─────────────────────────────────────────────────────────
 *  R8 MASTERY GATE
 *  70% threshold, tier unlock, double-fail expert nudge
 * ───────────────────────────────────────────────────────── */

export type MasteryResult = {
  score: number;
  passed: boolean;
  nextTier: PedagogyLevel | null;
  consecutiveFails: number;
  triggerExpertNudge: boolean;
  feedback: string;
};

export function evaluateMastery(
  score: number,
  totalQuestions: number,
  currentLevel: PedagogyLevel,
  previousConsecutiveFails: number,
): MasteryResult {
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = pct >= 70;

  const tierOrder: PedagogyLevel[] = ["foundation", "builder", "master"];
  const currentIdx = tierOrder.indexOf(currentLevel);

  let nextTier: PedagogyLevel | null = null;
  if (passed && currentIdx < tierOrder.length - 1) {
    nextTier = tierOrder[currentIdx + 1];
  }

  const consecutiveFails = passed ? 0 : previousConsecutiveFails + 1;
  const triggerExpertNudge = consecutiveFails >= 2;

  let feedback: string;
  if (passed && nextTier) {
    feedback = `Excellent! You scored ${pct}% and unlocked the ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} tier. Keep advancing!\n\nPowered by Pinnacle Software Solution | Mastery Verified.`;
  } else if (passed) {
    feedback = `Outstanding! You scored ${pct}% at the highest tier. You have achieved full mastery.\n\nPowered by Pinnacle Software Solution | Mastery Verified.`;
  } else if (triggerExpertNudge) {
    feedback = `You scored ${pct}% (need 70% to advance). This is your second attempt — it is completely normal to need guidance. Tap below to connect with a Pinnacle Expert who can help you break through.\n\nPowered by Pinnacle Software Solution | Contact: 9535761292`;
  } else {
    feedback = `You scored ${pct}% (need 70% to advance). Review the lesson tips and try again — you are closer than you think!\n\nPowered by Pinnacle Software Solution | Mastery Verified.`;
  }

  return { score: pct, passed, nextTier, consecutiveFails, triggerExpertNudge, feedback };
}

export function getLocalSocialProof(): LocalSocialProof {
  return {
    localActive: "34 Students from Srivilliputhur currently active in Vedic Maths.",
    recentHighScore: "Recent High Score: Grade 9 Student from VPMM Group of Institutions.",
    institution: "VPMM Group of Institutions, Srivilliputhur",
  };
}

export type SocraticPhase = {
  phase: "strategy" | "scaffolding" | "verification";
  label: string;
  content: string;
};

function nearestBase(n: number): number {
  if (n <= 15) return 10;
  if (n <= 150) return 100;
  return 1000;
}

export function generateSocraticVedicResponse(a: number, b: number): SocraticPhase[] {
  const product = a * b;
  const unitsA = a % 10;
  const unitsB = b % 10;
  const answerEndsIn = product % 10;

  const baseA = nearestBase(a);
  const baseB = nearestBase(b);
  const compA = a - baseA;
  const compB = b - baseB;
  const sameBase = baseA === baseB;

  const fmtComp = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  if (sameBase) {
    const crossResult = a + compB;
    const tailResult = compA * compB;

    return [
      {
        phase: "strategy",
        label: "Step 1: The Base",
        content: `Both ${a} and ${b} are near Base ${baseA}.\n\nThe Nikhilam Sutra states: when two numbers sit close to the same power of 10, their complements simplify cross-terms.\n\n• ${a} is ${fmtComp(compA)} from ${baseA}\n• ${b} is ${fmtComp(compB)} from ${baseA}`,
      },
      {
        phase: "scaffolding",
        label: "Step 2: Complements & Cross-Multiplication",
        content: `Complement of ${a}: ${fmtComp(compA)}\nComplement of ${b}: ${fmtComp(compB)}\n\nCross-subtraction: ${a} + (${compB >= 0 ? "+" : ""}${compB}) = ${crossResult}\nTail product: (${compA}) × (${compB}) = ${tailResult}\n\n┌───────────────────────────────┐\n│  ${a}  ────  [${fmtComp(compA)}]            │\n│      ╲  ╱                     │\n│       ╲╱    Cross: ${crossResult}          │\n│       ╱╲                      │\n│      ╱  ╲                     │\n│  ${b}  ────  [${fmtComp(compB)}]            │\n│                               │\n│  Answer: ${crossResult} | ${Math.abs(tailResult).toString().padStart(baseA === 10 ? 1 : baseA === 100 ? 2 : 3, "0")}  →  ${product.toLocaleString()}  │\n└───────────────────────────────┘`,
      },
      {
        phase: "verification",
        label: "Step 3: Pinnacle Verification",
        content: `Pinnacle Check: ${unitsA} × ${unitsB} = ${unitsA * unitsB}. Does the answer end in ${answerEndsIn}? Yes! Precision confirmed.\n\nFinal answer: ${a} × ${b} = ${product.toLocaleString()}\n\nPowered by Pinnacle Software Solution | Mastery Verified.\nNeed help? WhatsApp 9535761292`,
      },
    ];
  }

  return [
    {
      phase: "strategy",
      label: "Step 1: The Base",
      content: `We identify each number's nearest base:\n\n• ${a} is near Base ${baseA}  →  complement ${fmtComp(compA)}\n• ${b} is near Base ${baseB}  →  complement ${fmtComp(compB)}\n\nSince the bases differ, we apply the Urdhva Tiryak (vertically-and-crosswise) decomposition to compute ${a} × ${b} systematically.`,
    },
    {
      phase: "scaffolding",
      label: "Step 2: Complements & Decomposition",
      content: `Decompose the multiplication:\n\n  ${a} = ${baseA} ${fmtComp(compA)}\n  ${b} = ${baseB} ${fmtComp(compB)}\n\n  ${a} × ${b}\n  = (${baseA} ${fmtComp(compA)}) × (${baseB} ${fmtComp(compB)})\n  = ${baseA}×${baseB}  +  ${baseA}×(${fmtComp(compB)})  +  (${fmtComp(compA)})×${baseB}  +  (${fmtComp(compA)})×(${fmtComp(compB)})\n  = ${baseA * baseB}  +  (${baseA * compB})  +  (${compA * baseB})  +  (${compA * compB})\n  = ${product.toLocaleString()}\n\n┌───────────────────────────────┐\n│  ${a}  ────  Base ${baseA} [${fmtComp(compA)}]    │\n│   ×                           │\n│  ${b}  ────  Base ${baseB}  [${fmtComp(compB)}]    │\n│                               │\n│  = ${product.toLocaleString()}                     │\n└───────────────────────────────┘`,
    },
    {
      phase: "verification",
      label: "Step 3: Pinnacle Verification",
        content: `Pinnacle Check: ${unitsA} × ${unitsB} = ${unitsA * unitsB}. Does the answer end in ${answerEndsIn}? Yes! Precision confirmed.\n\nFinal answer: ${a} × ${b} = ${product.toLocaleString()}\n\nPowered by Pinnacle Software Solution | Mastery Verified.\nNeed help? WhatsApp 9535761292`,
      },
  ];
}
