"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type TopModuleWorkbenchProps = {
  moduleSlug: string;
  moduleTitle: string;
};

type VedicQuestion = {
  id: number;
  prompt: string;
  answer: number;
  concept: string;
};

type ModuleHistoryRow = {
  id: string;
  createdAt: string;
  inputData: unknown;
  outputData: unknown;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChallengeQuestion = {
  id: number;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

type ModuleBlueprint = {
  focus: string;
  practiceTask: string;
  challengeTheme: string;
  lessonTips: string[];
};

const MODULE_BLUEPRINTS: Record<string, ModuleBlueprint> = {
  "speed-tricks": {
    focus: "Timed solving habits and shortcut selection",
    practiceTask: "Solve 10 mixed arithmetic problems under a self-set timer.",
    challengeTheme: "Pacing and accuracy sprint",
    lessonTips: [
      "Pick the shortest valid method, not the fanciest method.",
      "Skip and return within 20 seconds if stuck.",
      "Always reserve a final verification minute.",
    ],
  },
  "memory-techniques": {
    focus: "Retention using chunking and spaced repetition",
    practiceTask: "Create 5 memory hooks for one chapter and revise after 2 hours.",
    challengeTheme: "Recall under pressure",
    lessonTips: [
      "Turn facts into stories with visual anchors.",
      "Use 3 quick recalls: immediate, 2-hour, next-day.",
      "Write without seeing notes to strengthen memory.",
    ],
  },
  "handwriting-improvement": {
    focus: "Legibility, spacing, and writing speed",
    practiceTask: "Write one paragraph in 5 minutes with uniform spacing.",
    challengeTheme: "Readable-speed writing test",
    lessonTips: [
      "Keep consistent letter height.",
      "Leave clean word spacing for easier evaluation.",
      "Underline key terms with straight strokes only.",
    ],
  },
  "neet-jee-daily-mcqs": {
    focus: "Daily exam-style MCQ consistency",
    practiceTask: "Attempt 15 MCQs and review every wrong answer reason.",
    challengeTheme: "Daily MCQ challenge",
    lessonTips: [
      "Track accuracy per chapter, not just total score.",
      "Avoid guess-heavy attempts early in prep.",
      "Review tricky options after each set.",
    ],
  },
  "tnpsc-prep": {
    focus: "State-focused exam readiness",
    practiceTask: "Practice one TNPSC topic with current affairs linkage.",
    challengeTheme: "TNPSC concept check",
    lessonTips: [
      "Connect static topics to recent events.",
      "Use Tamil + English terminology mapping.",
      "Revise short facts daily in 10-minute bursts.",
    ],
  },
  "rank-predictor": {
    focus: "Performance trend interpretation",
    practiceTask: "Record 3 recent scores and identify trend direction.",
    challengeTheme: "Trend confidence estimator",
    lessonTips: [
      "Consistency is a stronger rank signal than one high score.",
      "Watch weak-topic variance across tests.",
      "Adjust plan weekly, not monthly.",
    ],
  },
  "weak-area-detection": {
    focus: "Topic-level diagnostic learning",
    practiceTask: "List 3 weak topics and assign corrective actions.",
    challengeTheme: "Weak-topic recovery plan",
    lessonTips: [
      "Find root cause: concept gap vs speed issue.",
      "Patch one weak topic fully before switching.",
      "Re-test weak topics within 72 hours.",
    ],
  },
  "voice-tutor": {
    focus: "Conversational doubt resolution",
    practiceTask: "Explain one concept aloud in under 60 seconds.",
    challengeTheme: "Audio-style concept clarity",
    lessonTips: [
      "Speak concept in plain language first.",
      "Use one example + one counterexample.",
      "Summarize in one final takeaway sentence.",
    ],
  },
  "ai-notes-generator": {
    focus: "High-quality short notes creation",
    practiceTask: "Convert one topic into 7 bullet revision notes.",
    challengeTheme: "Revision-note quality check",
    lessonTips: [
      "Write notes for retrieval, not for decoration.",
      "Use headers: formula, idea, exception.",
      "Keep each note under two lines.",
    ],
  },
  "ai-quiz-generator": {
    focus: "Rapid adaptive question practice",
    practiceTask: "Generate 10 self-quiz prompts from your notes.",
    challengeTheme: "Adaptive quiz round",
    lessonTips: [
      "Mix easy, medium, and hard questions.",
      "Convert mistakes into new quiz questions.",
      "Reattempt incorrect questions after review.",
    ],
  },
  "public-speaking": {
    focus: "Confident communication and stage clarity",
    practiceTask: "Record a 2-minute topic speech and self-review.",
    challengeTheme: "Confidence challenge",
    lessonTips: [
      "Open with one clear hook sentence.",
      "Use pause, not filler words.",
      "Close with one memorable message.",
    ],
  },
  "coding-for-kids": {
    focus: "Logic building and computational thinking",
    practiceTask: "Write pseudo-steps for one simple daily process.",
    challengeTheme: "Logic builder challenge",
    lessonTips: [
      "Break big problem into tiny steps.",
      "Use if-then reasoning in plain language.",
      "Test with one example input.",
    ],
  },
  robotics: {
    focus: "Hands-on STEM problem solving",
    practiceTask: "Design one sensor-action flow for a basic bot.",
    challengeTheme: "Robotics design challenge",
    lessonTips: [
      "Define input, process, output clearly.",
      "Prototype quickly before optimization.",
      "Measure and iterate with evidence.",
    ],
  },
  "financial-literacy": {
    focus: "Budgeting and money decision fundamentals",
    practiceTask: "Create a 7-day spending budget with savings target.",
    challengeTheme: "Money planning challenge",
    lessonTips: [
      "Track needs vs wants separately.",
      "Always allocate fixed savings first.",
      "Review budget leak points weekly.",
    ],
  },
  "focus-exercises": {
    focus: "Concentration and distraction control",
    practiceTask: "Run two 25-minute focus sessions with a break log.",
    challengeTheme: "Attention stamina challenge",
    lessonTips: [
      "Study in short deep-focus blocks.",
      "Keep phone physically away in sessions.",
      "Start with the hardest task first.",
    ],
  },
  "exam-stress-management": {
    focus: "Calm performance under exam pressure",
    practiceTask: "Use 4-7-8 breathing before one mock test.",
    challengeTheme: "Calm exam readiness",
    lessonTips: [
      "Prepare checklist the night before exam.",
      "Control breath to control panic spikes.",
      "Replace negative self-talk with process cues.",
    ],
  },
  "habit-tracker": {
    focus: "Consistency building through routines",
    practiceTask: "Track 3 daily habits for one week.",
    challengeTheme: "Consistency streak challenge",
    lessonTips: [
      "Attach new habits to existing routines.",
      "Start tiny and keep streak unbroken.",
      "Review streak misses without guilt.",
    ],
  },
  "screen-time-monitor": {
    focus: "Healthy digital balance for learning",
    practiceTask: "Set app-wise study and non-study time limits.",
    challengeTheme: "Balanced screen discipline",
    lessonTips: [
      "Define intentional screen slots in advance.",
      "Use offline revision after each online session.",
      "Audit total screen time each evening.",
    ],
  },
};

type VedicLevel = "beginner" | "intermediate" | "advanced";

const VEDIC_LEVELS: VedicLevel[] = ["beginner", "intermediate", "advanced"];

const VEDIC_LESSONS = [
  {
    title: "Base Method (near 10/100)",
    summary: "Use complements from the base to multiply numbers close to 10, 100, or 1000 quickly.",
    example: "97 x 96 = (97-4) | (4x6) => 93 | 24 = 9324",
  },
  {
    title: "Left-to-Right Addition",
    summary: "Add larger place values first to reduce cognitive load and improve speed.",
    example: "478 + 365 = (400+300) + (70+60) + (8+5) = 843",
  },
  {
    title: "Cross-Check Last Digit",
    summary: "Verify units digit before finalizing answers to catch common mistakes quickly.",
    example: "43 x 27 => units should end with 1 (3x7=21), so result must end in 1",
  },
] as const;

function createQuestionByLevel(id: number, level: VedicLevel): VedicQuestion {
  if (level === "beginner") {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 10;
    return { id, prompt: `${a} + ${b}`, answer: a + b, concept: "Addition speed" };
  }

  if (level === "intermediate") {
    const a = Math.floor(Math.random() * 50) + 25;
    const b = Math.floor(Math.random() * 50) + 25;
    const op = Math.random() > 0.5 ? "x" : "+";
    return op === "x"
      ? { id, prompt: `${a} x ${b}`, answer: a * b, concept: "Base multiplication" }
      : { id, prompt: `${a} + ${b}`, answer: a + b, concept: "Addition speed" };
  }

  const a = Math.floor(Math.random() * 70) + 30;
  const b = Math.floor(Math.random() * 70) + 30;
  const c = Math.floor(Math.random() * 30) + 10;
  const pattern = Math.random() > 0.5;
  return pattern
    ? {
        id,
        prompt: `(${a} x ${b}) + ${c}`,
        answer: a * b + c,
        concept: "Mixed operation under pressure",
      }
    : {
        id,
        prompt: `${a} + ${b} + ${c}`,
        answer: a + b + c,
        concept: "Multi-step addition",
      };
}

function timerByLevel(level: VedicLevel): number {
  if (level === "beginner") return 180;
  if (level === "intermediate") return 150;
  return 120;
}

async function fetchHistory(moduleSlug: string): Promise<ModuleHistoryRow[]> {
  const response = await fetch(`/api/modules/history?moduleSlug=${encodeURIComponent(moduleSlug)}&limit=5`, {
    credentials: "include",
  });
  if (response.status === 401) throw new Error("AUTH_REQUIRED");
  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: ModuleHistoryRow[] };
  return payload.data ?? [];
}

async function saveHistory(moduleSlug: string, moduleTitle: string, inputData: unknown, outputData: unknown) {
  const response = await fetch("/api/modules/history", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleSlug, moduleTitle, inputData, outputData }),
  });
  if (response.status === 401) throw new Error("AUTH_REQUIRED");
}

function AuthRequiredBanner() {
  return (
    <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200">
      <p className="font-semibold">Sign in and claim your school to save module history.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href="/api/auth/signin"
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950"
        >
          Sign In
        </Link>
        <Link
          href="/onboarding"
          className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-200"
        >
          Claim School
        </Link>
      </div>
    </div>
  );
}

function HistoryPanel({ title, rows }: { title: string; rows: ModuleHistoryRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-cyan-300">{title}</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-300">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            <p className="font-medium text-slate-200">{new Date(row.createdAt).toLocaleString()}</p>
            <p className="mt-1 text-slate-400">Input: {JSON.stringify(row.inputData)}</p>
            <p className="mt-1 text-slate-400">Output: {JSON.stringify(row.outputData)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VedicChatPanel({ level }: { level: VedicLevel }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I am your Vedic Maths AI tutor. Ask me about tricks, shortcuts, or any question from your lesson/exam.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askTutor = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/modules/vedic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: `Current level: ${level}`,
        }),
      });

      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? "Tutor is unavailable right now.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: payload.answer! }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tutor request failed";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not answer right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-cyan-300">AI Vedic Tutor Chatbot</p>
      <p className="mt-1 text-xs text-slate-400">
        Ask doubts during lessons or while solving timed exams. Ex: &quot;Teach base-100 multiplication with
        shortcuts.&quot;
      </p>

      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-3">
        {messages.map((m, idx) => (
          <div
            key={`${m.role}-${idx}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "ml-6 bg-cyan-500/20 text-cyan-100" : "mr-6 bg-slate-800 text-slate-200"
            }`}
          >
            <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">{m.role}</p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {isLoading ? <p className="text-xs text-amber-300">Tutor is thinking...</p> : null}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void askTutor();
            }
          }}
          placeholder="Ask your Vedic Maths doubt..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
        <button
          onClick={() => void askTutor()}
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          Ask
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

function StudyPlannerWorkbench() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [grade, setGrade] = useState("Class 8");
  const [dailyHours, setDailyHours] = useState(2);
  const [goal, setGoal] = useState("Weekly mastery");
  const [examDate, setExamDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Maths", "Science", "English"]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(["Maths"]);
  const [plan, setPlan] = useState<string[]>([]);
  const [summaryText, setSummaryText] = useState("");
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  const classOptions = useMemo(
    () => ["Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    [],
  );

  const subjectOptions = useMemo(
    () => ["Maths", "Science", "English", "Social", "Tamil", "Computer Science", "General Knowledge"],
    [],
  );

  const days = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);

  const revisionWeight = useMemo(() => {
    if (!selectedSubjects.length) return 0;
    return Math.min(3, Math.max(1, weakSubjects.length));
  }, [selectedSubjects.length, weakSubjects.length]);

  const buildPlan = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSubjects.length) {
      setPlan(["Select at least one subject to build your plan."]);
      return;
    }

    const cycle = selectedSubjects.length;
    const revisionMinutes = 20 + revisionWeight * 10;
    const examTag = examDate ? `Exam focus till ${examDate}` : "No exam date set";

    const nextPlan = days.map((day, index) => {
      const morningSubject = selectedSubjects[index % cycle];
      const eveningSubject = selectedSubjects[(index + 2) % cycle];
      const weakFocus = weakSubjects[index % Math.max(weakSubjects.length, 1)] ?? selectedSubjects[index % cycle];
      const timeSplit = `${Math.max(1, Math.round(dailyHours * 0.6))}h concept + ${Math.max(
        1,
        Math.round(dailyHours * 0.4),
      )}h practice`;
      return `${day}: ${morningSubject} (${timeSplit}) | Revision ${revisionMinutes}m on ${weakFocus} | Evening quiz: ${eveningSubject}.`;
    });

    const summary = [
      `AI Study Planner Summary`,
      `Class: ${grade}`,
      `Goal: ${goal}`,
      `Daily Hours: ${dailyHours}`,
      `Subjects: ${selectedSubjects.join(", ")}`,
      `Weak Subjects: ${weakSubjects.join(", ") || "None"}`,
      examTag,
      `Revision Intensity: Level ${revisionWeight}`,
      "",
      ...nextPlan,
    ].join("\n");

    setPlan(nextPlan);
    setSummaryText(summary);
    setStep(3);

    void (async () => {
      try {
        await saveHistory(
          "ai-study-planner",
          "AI Study Planner",
          { grade, goal, examDate, dailyHours, subjects: selectedSubjects, weakSubjects },
          { revisionWeight, weeklyPlan: nextPlan, summary },
        );
        setHistory(await fetchHistory("ai-study-planner"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  };

  const downloadSummary = () => {
    if (!summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-study-plan.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory("ai-study-planner"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">AI Study Planner Pro</h2>
      <p className="mt-1 text-sm text-slate-300">
        Multi-step onboarding, revision-balanced weekly engine, and export-ready study summary.
      </p>

      <div className="mt-4 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as 1 | 2 | 3)}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              step === s ? "bg-cyan-500 text-slate-950" : "border border-slate-700 text-cyan-300"
            }`}
          >
            Step {s}
          </button>
        ))}
      </div>

      <form onSubmit={buildPlan} className="mt-4 grid gap-3 sm:grid-cols-2">
        {step === 1 ? (
          <>
            <label className="text-sm text-slate-300">
              Class
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Study Goal
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="Weekly mastery">Weekly mastery</option>
                <option value="Exam preparation">Exam preparation</option>
                <option value="Competitive readiness">Competitive readiness</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Study Hours / Day
              <input
                type="number"
                min={1}
                max={8}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-300">
              Upcoming Exam Date (optional)
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <label className="text-sm text-slate-300 sm:col-span-2">
              Subjects (multi-select)
              <select
                multiple
                value={selectedSubjects}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((option) => option.value);
                  setSelectedSubjects(values);
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300 sm:col-span-2">
              Weak Subjects (priority revision)
              <select
                multiple
                value={weakSubjects}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((option) => option.value);
                  setWeakSubjects(values);
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {selectedSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Hold Ctrl/Cmd for multi-select.</p>
            </label>
          </>
        ) : null}

        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Generate Smart Weekly Plan
        </button>
      </form>

      {plan.length > 0 ? (
        <div className="mt-4 space-y-3">
          <ul className="space-y-2 text-sm text-slate-200">
            {plan.map((item) => (
              <li key={item} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadSummary}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-cyan-300"
            >
              Download Plan Summary
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-cyan-300"
            >
              Print Plan
            </button>
          </div>

          {summaryText ? (
            <textarea
              readOnly
              value={summaryText}
              className="h-44 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300"
            />
          ) : null}
        </div>
      ) : null}
      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Planner History" rows={history} />
    </section>
  );
}

function HomeworkHelperWorkbench() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [question, setQuestion] = useState("");
  const [standard, setStandard] = useState("Class 6");
  const [subject, setSubject] = useState("Maths");
  const [topic, setTopic] = useState("Algebra Basics");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  const subjectOptions = useMemo(
    () => ["Maths", "Science", "English", "Social", "Tamil", "Computer Science"],
    [],
  );

  const buildHelp = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setError("Enter a homework question to get guided steps.");
      return;
    }
    setError(null);
    setChallengeFeedback(null);
    setStep(2);
    setIsLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/modules/homework-helper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            standard,
            subject,
            topic,
            question,
          }),
        });

        const payload = (await res.json()) as { answer?: string; error?: string };
        if (!res.ok || !payload.answer) {
          throw new Error(payload.error ?? "Unable to generate guidance right now.");
        }

        setResponse(payload.answer);

        await saveHistory(
          "homework-helper",
          "Homework Helper",
          { standard, subject, topic, question },
          { guidedResponse: payload.answer },
        );
        setHistory(await fetchHistory("homework-helper"));
        setAuthRequired(false);
      } catch (err) {
        if (err instanceof Error && err.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        } else {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setError(msg);
          setStep(1);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const evaluateChallenge = async () => {
    const normalized = challengeAnswer.trim().toLowerCase();
    if (!normalized) {
      setChallengeFeedback("Write your attempt first.");
      return;
    }

    const confident = normalized.length >= 18;
    const feedback = confident
      ? "Good attempt. You explained enough steps. Improve by adding one final verification line."
      : "Too short. Add key formula/reasoning in 2-3 lines.";
    setChallengeFeedback(feedback);
    setStep(3);

    try {
      await saveHistory(
        "homework-helper",
        "Homework Helper",
        { challengeAttempt: challengeAnswer, subject, topic },
        { challengeFeedback: feedback, pass: confident },
      );
      setHistory(await fetchHistory("homework-helper"));
      setAuthRequired(false);
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        setAuthRequired(true);
      }
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory("homework-helper"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Homework Helper Pro</h2>
      <p className="mt-1 text-sm text-slate-300">
        Guided setup, AI tutor solution, and challenge check to confirm understanding.
      </p>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as 1 | 2 | 3)}
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              step === s ? "bg-cyan-500 text-slate-950" : "border border-slate-700 text-cyan-300"
            }`}
          >
            Step {s}
          </button>
        ))}
      </div>
      <form onSubmit={buildHelp} className="mt-4 space-y-3">
        {step === 1 ? (
          <>
            <label className="block text-sm text-slate-300">
              Grade Level
              <input
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Subject
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {subjectOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Topic
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Homework Question
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </>
        ) : null}
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          {isLoading ? "Generating..." : "Generate Guided Solution"}
        </button>
      </form>

      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

      {step >= 2 && response ? (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">AI Tutor Response</p>
          <pre className="whitespace-pre-wrap font-sans">{response}</pre>
        </div>
      ) : null}

      {step >= 2 ? (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
          <p className="text-sm font-semibold text-cyan-300">Step 3: Quick Understanding Challenge</p>
          <p className="mt-1 text-xs text-slate-400">
            In your own words: explain the main concept used in this solution.
          </p>
          <textarea
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <button
            onClick={() => void evaluateChallenge()}
            className="mt-2 rounded-lg border border-cyan-400 px-3 py-2 text-xs font-semibold text-cyan-300"
          >
            Evaluate My Understanding
          </button>
          {challengeFeedback ? <p className="mt-2 text-sm text-emerald-300">{challengeFeedback}</p> : null}
        </div>
      ) : null}
      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Homework Sessions" rows={history} />
    </section>
  );
}

function VedicMathsWorkbench() {
  const [lessonComplete, setLessonComplete] = useState(false);
  const [activeLevel, setActiveLevel] = useState<VedicLevel>("beginner");
  const [unlockedLevels, setUnlockedLevels] = useState<VedicLevel[]>(["beginner"]);
  const [questions, setQuestions] = useState<VedicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timerByLevel("beginner"));
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  const regenerate = (level: VedicLevel) => {
    setQuestions(Array.from({ length: 10 }, (_, i) => createQuestionByLevel(i + 1, level)));
    setAnswers({});
    setScore(null);
    setAccuracy(null);
    setResultSummary(null);
    setSecondsLeft(timerByLevel(level));
  };

  const startExam = () => {
    regenerate(activeLevel);
    setExamStarted(true);
  };

  const unlockNextLevel = (current: VedicLevel) => {
    const idx = VEDIC_LEVELS.indexOf(current);
    if (idx < VEDIC_LEVELS.length - 1) {
      const next = VEDIC_LEVELS[idx + 1];
      setUnlockedLevels((prev) => (prev.includes(next) ? prev : [...prev, next]));
    }
  };

  const evaluate = useCallback(() => {
    if (!questions.length) return;
    const correct = questions.filter((q) => Number(answers[q.id]) === q.answer).length;
    const currentAccuracy = Math.round((correct / questions.length) * 100);
    const pass = currentAccuracy >= 70;

    setScore(correct);
    setAccuracy(currentAccuracy);
    setResultSummary(pass ? "Pass: Great speed and accuracy." : "Not yet pass. Review lesson and retry.");
    setExamStarted(false);

    if (pass) {
      unlockNextLevel(activeLevel);
    }

    void (async () => {
      try {
        await saveHistory(
          "vedic-maths",
          "Vedic Maths",
          {
            level: activeLevel,
            timeRemaining: secondsLeft,
            questions: questions.map((q) => ({ prompt: q.prompt, concept: q.concept })),
            answers,
          },
          {
            score: `${correct}/${questions.length}`,
            accuracy: `${currentAccuracy}%`,
            pass,
          },
        );
        setHistory(await fetchHistory("vedic-maths"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, [questions, answers, activeLevel, secondsLeft]);

  useEffect(() => {
    if (!examStarted) return;

    if (secondsLeft <= 0) {
      const timeoutId = window.setTimeout(() => {
        evaluate();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [examStarted, secondsLeft, evaluate]);

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory("vedic-maths"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Vedic Maths: Learn Then Exam</h2>
      <p className="mt-1 text-sm text-slate-300">
        Complete lessons, choose level, and finish timed exam (70% pass threshold) to unlock progression.
      </p>

      {!lessonComplete ? (
        <div className="mt-4 space-y-3">
          {VEDIC_LESSONS.map((lesson) => (
            <div key={lesson.title} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <p className="font-semibold text-cyan-300">{lesson.title}</p>
              <p className="mt-1">{lesson.summary}</p>
              <p className="mt-1 text-emerald-300">{lesson.example}</p>
            </div>
          ))}
          <button
            onClick={() => setLessonComplete(true)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            I Learned, Start Exam
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {VEDIC_LEVELS.map((level) => {
              const unlocked = unlockedLevels.includes(level);
              return (
                <button
                  key={level}
                  disabled={!unlocked || examStarted}
                  onClick={() => {
                    setActiveLevel(level);
                    regenerate(level);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    activeLevel === level ? "bg-cyan-500 text-slate-950" : "border border-slate-700 text-cyan-300"
                  } disabled:opacity-40`}
                >
                  {level}
                </button>
              );
            })}
            <button
              onClick={startExam}
              disabled={examStarted}
              className="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-40"
            >
              Start Timed Exam
            </button>
          </div>

          {examStarted ? (
            <p className="mt-3 text-sm font-semibold text-amber-300">Time Left: {secondsLeft}s</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {questions.map((q) => (
              <label key={q.id} className="block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
                <span className="text-slate-200">
                  Q{q.id}: {q.prompt}
                </span>
                <span className="ml-2 text-xs text-emerald-300">({q.concept})</span>
                <input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Enter answer"
                  disabled={!examStarted}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={evaluate}
              disabled={!examStarted}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
            >
              Check Score
            </button>
            <button
              onClick={() => regenerate(activeLevel)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-300"
            >
              New Set
            </button>
          </div>
          {score !== null ? <p className="mt-3 text-sm text-emerald-300">Score: {score} / {questions.length}</p> : null}
          {accuracy !== null ? <p className="mt-1 text-sm text-cyan-300">Accuracy: {accuracy}%</p> : null}
          {resultSummary ? <p className="mt-1 text-sm text-amber-300">{resultSummary}</p> : null}
        </>
      )}
      <VedicChatPanel level={activeLevel} />
      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Practice Scores" rows={history} />
    </section>
  );
}

function buildChallengeSet(moduleSlug: string, moduleTitle: string): ChallengeQuestion[] {
  const base = MODULE_BLUEPRINTS[moduleSlug];
  const focus = base?.focus ?? `${moduleTitle} core concepts`;
  return [
    {
      id: 1,
      prompt: `Which habit best improves ${focus.toLowerCase()}?`,
      options: ["Random practice", "Consistent tracked practice", "No revision", "Last-minute cramming"],
      answer: "Consistent tracked practice",
      explanation: "Consistency with tracking gives measurable growth and correction loops.",
    },
    {
      id: 2,
      prompt: "What should you do after making a mistake?",
      options: ["Ignore it", "Blame difficulty", "Log cause and fix strategy", "Switch topic immediately"],
      answer: "Log cause and fix strategy",
      explanation: "Mistake analysis converts weak spots into specific improvement actions.",
    },
    {
      id: 3,
      prompt: "Best revision strategy for retention is:",
      options: ["One long session", "Spaced short revision", "No recall test", "Only passive reading"],
      answer: "Spaced short revision",
      explanation: "Spaced revision improves long-term memory and practical recall speed.",
    },
  ];
}

type GeneratedQuizItem = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function QuizGeneratorWorkbench() {
  const [grade, setGrade] = useState("Class 8");
  const [subject, setSubject] = useState("Maths");
  const [topic, setTopic] = useState("Fractions");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<GeneratedQuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory("ai-quiz-generator"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, []);

  const generateQuiz = async () => {
    setLoading(true);
    setScore(null);
    try {
      const response = await fetch("/api/modules/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topic, difficulty, questionCount }),
      });
      const payload = (await response.json()) as { data?: { quiz?: GeneratedQuizItem[] } };
      const items = payload.data?.quiz ?? [];
      setQuiz(items);
      setAnswers({});
      try {
        await saveHistory("ai-quiz-generator", "AI Quiz Generator", { grade, subject, topic, difficulty }, { generated: items.length });
        setHistory(await fetchHistory("ai-quiz-generator"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    const correct = quiz.filter((q, idx) => answers[idx] === q.answer).length;
    setScore(correct);
    void (async () => {
      try {
        await saveHistory(
          "ai-quiz-generator",
          "AI Quiz Generator",
          { attempted: quiz.length, answers },
          { score: `${correct}/${quiz.length}` },
        );
        setHistory(await fetchHistory("ai-quiz-generator"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  };

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">AI Quiz Generator Pro</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:col-span-2" />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <input type="number" min={3} max={10} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
      </div>
      <button onClick={() => void generateQuiz()} className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {quiz.length > 0 ? (
        <div className="mt-4 space-y-3">
          {quiz.map((q, idx) => (
            <div key={`${q.question}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-sm font-semibold text-slate-100">{idx + 1}. {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-xs text-slate-300">
                    <input type="radio" name={`quiz-${idx}`} value={opt} checked={answers[idx] === opt} onChange={(e) => setAnswers((p) => ({ ...p, [idx]: e.target.value }))} />
                    {opt}
                  </label>
                ))}
              </div>
              {score !== null ? <p className="mt-2 text-xs text-emerald-300">Answer: {q.answer} | {q.explanation}</p> : null}
            </div>
          ))}
          <button onClick={submitQuiz} className="rounded-lg border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-300">Submit Quiz</button>
          {score !== null ? <p className="text-sm text-emerald-300">Score: {score}/{quiz.length}</p> : null}
        </div>
      ) : null}
      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Quiz Activity" rows={history} />
    </section>
  );
}

function NotesGeneratorWorkbench() {
  const [grade, setGrade] = useState("Class 8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("Photosynthesis");
  const [style, setStyle] = useState<"exam" | "quick-revision" | "conceptual">("quick-revision");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory("ai-notes-generator"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, []);

  const generateNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/modules/notes-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topic, style }),
      });
      const payload = (await response.json()) as { notes?: string };
      const text = payload.notes ?? "Unable to generate notes.";
      setNotes(text);
      try {
        await saveHistory("ai-notes-generator", "AI Notes Generator", { grade, subject, topic, style }, { generated: Boolean(payload.notes) });
        setHistory(await fetchHistory("ai-notes-generator"));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">AI Notes Generator Pro</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:col-span-2" />
        <select value={style} onChange={(e) => setStyle(e.target.value as "exam" | "quick-revision" | "conceptual")} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 sm:col-span-2">
          <option value="exam">exam</option>
          <option value="quick-revision">quick-revision</option>
          <option value="conceptual">conceptual</option>
        </select>
      </div>
      <button onClick={() => void generateNotes()} className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
        {loading ? "Generating..." : "Generate Notes"}
      </button>
      {notes ? (
        <textarea readOnly value={notes} className="mt-4 h-64 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200" />
      ) : null}
      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Notes Activity" rows={history} />
    </section>
  );
}

function UniversalModuleWorkbench({ moduleSlug, moduleTitle }: { moduleSlug: string; moduleTitle: string }) {
  const blueprint = MODULE_BLUEPRINTS[moduleSlug] ?? {
    focus: `${moduleTitle} practical mastery`,
    practiceTask: `Complete one guided activity in ${moduleTitle}.`,
    challengeTheme: `${moduleTitle} confidence challenge`,
    lessonTips: [
      "Start with fundamentals and examples.",
      "Practice in short, consistent loops.",
      "Measure outcomes and refine weekly.",
    ],
  };

  const [tab, setTab] = useState<"learn" | "practice" | "challenge">("learn");
  const [practiceNotes, setPracticeNotes] = useState("");
  const [practiceDone, setPracticeDone] = useState(false);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);
  const [challengeQuestions] = useState<ChallengeQuestion[]>(() => buildChallengeSet(moduleSlug, moduleTitle));
  const [challengeAnswers, setChallengeAnswers] = useState<Record<number, string>>({});
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setHistory(await fetchHistory(moduleSlug));
        setAuthRequired(false);
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      }
    })();
  }, [moduleSlug]);

  const savePractice = async () => {
    try {
      await saveHistory(
        moduleSlug,
        moduleTitle,
        { mode: "practice", notes: practiceNotes },
        { completed: practiceDone, activity: blueprint.practiceTask },
      );
      setHistory(await fetchHistory(moduleSlug));
      setAuthRequired(false);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        setAuthRequired(true);
      }
    }
  };

  const submitChallenge = async () => {
    const correct = challengeQuestions.filter((q) => challengeAnswers[q.id] === q.answer).length;
    setChallengeScore(correct);
    try {
      await saveHistory(
        moduleSlug,
        moduleTitle,
        { mode: "challenge", answers: challengeAnswers },
        { score: `${correct}/${challengeQuestions.length}`, theme: blueprint.challengeTheme },
      );
      setHistory(await fetchHistory(moduleSlug));
      setAuthRequired(false);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        setAuthRequired(true);
      }
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">{moduleTitle}: Complete Learning Module</h2>
      <p className="mt-1 text-sm text-slate-300">{blueprint.focus}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["learn", "practice", "challenge"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              tab === item ? "bg-cyan-500 text-slate-950" : "border border-slate-700 text-cyan-300"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "learn" ? (
        <div className="mt-4 space-y-2">
          {blueprint.lessonTips.map((tip) => (
            <div key={tip} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              {tip}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "practice" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-200">{blueprint.practiceTask}</p>
          <textarea
            value={practiceNotes}
            onChange={(e) => setPracticeNotes(e.target.value)}
            rows={4}
            placeholder="Write your practice reflection or solution notes..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={practiceDone} onChange={(e) => setPracticeDone(e.target.checked)} />
            I completed this practice task.
          </label>
          <button onClick={() => void savePractice()} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Save Practice Progress
          </button>
        </div>
      ) : null}

      {tab === "challenge" ? (
        <div className="mt-4 space-y-3">
          {challengeQuestions.map((q) => (
            <div key={q.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-sm font-semibold text-slate-100">
                Q{q.id}. {q.prompt}
              </p>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={challengeAnswers[q.id] === opt}
                      onChange={(e) =>
                        setChallengeAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => void submitChallenge()} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            Submit Challenge
          </button>
          {challengeScore !== null ? (
            <p className="text-sm text-emerald-300">
              Score: {challengeScore}/{challengeQuestions.length}
            </p>
          ) : null}
        </div>
      ) : null}

      {authRequired ? <AuthRequiredBanner /> : null}
      <HistoryPanel title="Recent Module Progress" rows={history} />
    </section>
  );
}

export function TopModuleWorkbench({ moduleSlug, moduleTitle }: TopModuleWorkbenchProps) {
  if (moduleSlug === "ai-study-planner") return <StudyPlannerWorkbench />;
  if (moduleSlug === "homework-helper") return <HomeworkHelperWorkbench />;
  if (moduleSlug === "vedic-maths") return <VedicMathsWorkbench />;
  if (moduleSlug === "ai-quiz-generator") return <QuizGeneratorWorkbench />;
  if (moduleSlug === "ai-notes-generator") return <NotesGeneratorWorkbench />;
  return <UniversalModuleWorkbench moduleSlug={moduleSlug} moduleTitle={moduleTitle} />;
}
