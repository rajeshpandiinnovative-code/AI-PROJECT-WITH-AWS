"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TopModuleWorkbenchProps = {
  moduleSlug: string;
  moduleTitle: string;
};

type VedicQuestion = {
  id: number;
  prompt: string;
  answer: number;
};

type ModuleHistoryRow = {
  id: string;
  createdAt: string;
  inputData: unknown;
  outputData: unknown;
};

function createQuestion(id: number): VedicQuestion {
  const a = Math.floor(Math.random() * 90) + 10;
  const b = Math.floor(Math.random() * 90) + 10;
  const useMultiply = Math.random() > 0.5;
  return useMultiply
    ? { id, prompt: `${a} x ${b}`, answer: a * b }
    : { id, prompt: `${a} + ${b}`, answer: a + b };
}

async function fetchHistory(moduleSlug: string): Promise<ModuleHistoryRow[]> {
  const response = await fetch(`/api/modules/history?moduleSlug=${encodeURIComponent(moduleSlug)}&limit=5`, {
    credentials: "include",
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: ModuleHistoryRow[] };
  return payload.data ?? [];
}

async function saveHistory(moduleSlug: string, moduleTitle: string, inputData: unknown, outputData: unknown) {
  await fetch("/api/modules/history", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleSlug, moduleTitle, inputData, outputData }),
  });
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

function StudyPlannerWorkbench() {
  const [grade, setGrade] = useState("Class 8");
  const [dailyHours, setDailyHours] = useState(2);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Maths", "Science", "English"]);
  const [plan, setPlan] = useState<string[]>([]);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);

  const classOptions = useMemo(
    () => ["Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    [],
  );

  const subjectOptions = useMemo(
    () => ["Maths", "Science", "English", "Social", "Tamil", "Computer Science", "General Knowledge"],
    [],
  );

  const buildPlan = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSubjects.length) {
      setPlan(["Select at least one subject to build your plan."]);
      return;
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const nextPlan = days.map((day, index) => {
      const subject = selectedSubjects[index % selectedSubjects.length];
      const revisionSubject = selectedSubjects[(index + 1) % selectedSubjects.length];
      return `${day}: ${subject} (${dailyHours}h) + quick revision of ${revisionSubject} (20m).`;
    });

    setPlan(nextPlan);
    void saveHistory(
      "ai-study-planner",
      "AI Study Planner",
      { grade, dailyHours, subjects: selectedSubjects },
      { weeklyPlan: nextPlan },
    ).then(async () => setHistory(await fetchHistory("ai-study-planner")));
  };

  useEffect(() => {
    void fetchHistory("ai-study-planner").then(setHistory);
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Interactive Planner</h2>
      <form onSubmit={buildPlan} className="mt-4 grid gap-3 sm:grid-cols-2">
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
        <label className="text-sm text-slate-300 sm:col-span-2">
          Subjects (dropdown multi-select)
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
          <p className="mt-1 text-xs text-slate-400">Hold Ctrl (or Cmd on Mac) to select multiple subjects.</p>
        </label>
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Generate {grade === "" ? "Weekly" : `Class ${grade}`} Plan
        </button>
      </form>

      {plan.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {plan.map((item) => (
            <li key={item} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <HistoryPanel title="Recent Planner History" rows={history} />
    </section>
  );
}

function HomeworkHelperWorkbench() {
  const [question, setQuestion] = useState("");
  const [standard, setStandard] = useState("Class 6");
  const [response, setResponse] = useState<string[]>([]);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);

  const buildHelp = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setResponse(["Enter a homework question to get guided steps."]);
      return;
    }

    const generated = [
      `Step 1 (${standard}): Identify what the question asks in one line.`,
      "Step 2: Write given values and keywords from the question.",
      "Step 3: Pick the method/formula and solve one step at a time.",
      "Step 4: Recheck units/signs and write the final answer clearly.",
      `Quick Hint: "${question.slice(0, 70)}${question.length > 70 ? "..." : ""}"`,
    ];
    setResponse(generated);
    void saveHistory(
      "homework-helper",
      "Homework Helper",
      { standard, question },
      { guidedSteps: generated },
    ).then(async () => setHistory(await fetchHistory("homework-helper")));
  };

  useEffect(() => {
    void fetchHistory("homework-helper").then(setHistory);
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Homework Helper Console</h2>
      <form onSubmit={buildHelp} className="mt-4 space-y-3">
        <label className="block text-sm text-slate-300">
          Grade Level
          <input
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
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
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Generate Guided Solution
        </button>
      </form>

      {response.length > 0 ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-200">
          {response.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : null}
      <HistoryPanel title="Recent Homework Sessions" rows={history} />
    </section>
  );
}

function VedicMathsWorkbench() {
  const [lessonComplete, setLessonComplete] = useState(false);
  const [questions, setQuestions] = useState<VedicQuestion[]>(() =>
    Array.from({ length: 5 }, (_, i) => createQuestion(i + 1)),
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<ModuleHistoryRow[]>([]);

  const regenerate = () => {
    setQuestions(Array.from({ length: 5 }, (_, i) => createQuestion(i + 1)));
    setAnswers({});
    setScore(null);
  };

  const evaluate = () => {
    const correct = questions.filter((q) => Number(answers[q.id]) === q.answer).length;
    setScore(correct);
    void saveHistory(
      "vedic-maths",
      "Vedic Maths",
      { questions: questions.map((q) => q.prompt), answers },
      { score: `${correct}/5` },
    ).then(async () => setHistory(await fetchHistory("vedic-maths")));
  };

  useEffect(() => {
    void fetchHistory("vedic-maths").then(setHistory);
  }, []);

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Vedic Maths: Learn Then Exam</h2>
      <p className="mt-1 text-sm text-slate-300">Complete lesson tips first, then start your speed practice exam.</p>

      {!lessonComplete ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <p className="font-semibold text-cyan-300">Tip 1: Complement Method (Base 100)</p>
            <p className="mt-1">For numbers close to 100, use complements to simplify multiplication quickly.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <p className="font-semibold text-cyan-300">Tip 2: Left-to-Right Addition</p>
            <p className="mt-1">Add higher place values first to estimate and reduce mental load.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <p className="font-semibold text-cyan-300">Tip 3: Cross-Check Last Digit</p>
            <p className="mt-1">Quickly verify the units place to catch common calculation mistakes.</p>
          </div>
          <button
            onClick={() => setLessonComplete(true)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            I Learned, Start Exam
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {questions.map((q) => (
              <label key={q.id} className="block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
                <span className="text-slate-200">
                  Q{q.id}: {q.prompt}
                </span>
                <input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Enter answer"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={evaluate} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
              Check Score
            </button>
            <button
              onClick={regenerate}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-300"
            >
              New Set
            </button>
          </div>
          {score !== null ? <p className="mt-3 text-sm text-emerald-300">Score: {score} / 5</p> : null}
        </>
      )}
      <HistoryPanel title="Recent Practice Scores" rows={history} />
    </section>
  );
}

export function TopModuleWorkbench({ moduleSlug, moduleTitle }: TopModuleWorkbenchProps) {
  if (moduleSlug === "ai-study-planner") return <StudyPlannerWorkbench />;
  if (moduleSlug === "homework-helper") return <HomeworkHelperWorkbench />;
  if (moduleSlug === "vedic-maths") return <VedicMathsWorkbench />;

  return (
    <section className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h2 className="text-lg font-semibold text-emerald-300">Module Workbench</h2>
      <p className="mt-2 text-sm text-slate-300">
        {moduleTitle} module shell is created. Interactive implementation will be added in the next sprint.
      </p>
    </section>
  );
}
