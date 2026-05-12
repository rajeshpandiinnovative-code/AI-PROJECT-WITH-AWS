"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Upload } from "lucide-react";

import { GradeSaveSuccessOverlay } from "@/src/components/lottie/GradeSaveSuccessOverlay";
import { ProcessingOverlay } from "@/src/components/lottie/ProcessingOverlay";

export type TeacherStudentOption = { id: string; name: string; rollNo: string | null };
export type TeacherExamOption = { id: string; name: string; dateLabel: string };

type Job = {
  id: string;
  file: File;
  fileName: string;
  phase: "queued" | "processing" | "success" | "error";
  marks?: number;
  feedback?: string;
  errorShort?: string;
  httpStatus?: number;
  code?: string;
};

function canRetry(status: number, code?: string) {
  if (status === 401 || status === 402 || status === 400) return false;
  if (code === "SUBSCRIPTION_REQUIRED") return false;
  return status === 422 || status === 503 || status === 500 || status === 0 || status >= 502;
}

export function PaperUpload({
  students,
  exams,
}: {
  students: TeacherStudentOption[];
  exams: TeacherExamOption[];
}) {
  const { data: session } = useSession();
  const sessionSchoolId =
    session?.user && typeof session.user.schoolId === "string" ? session.user.schoolId : undefined;
  const isTeacher = session?.user?.role === "TEACHER";

  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [gradeSavedSignal, setGradeSavedSignal] = useState(0);

  const showProcessingOverlay = useMemo(
    () => isTeacher && jobs.some((j) => j.phase === "processing"),
    [isTeacher, jobs],
  );

  const runOne = useCallback(
    async (job: Job): Promise<void> => {
      const fd = new FormData();
      fd.set("studentId", studentId);
      fd.set("examId", examId);
      fd.set("maxMarks", String(maxMarks));
      fd.set("image", job.file);
      let res: Response;
      try {
        res = await fetch("/api/scan-paper", { method: "POST", body: fd, credentials: "same-origin" });
      } catch {
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id
              ? {
                  ...x,
                  phase: "error",
                  errorShort: "Network error — try again.",
                  httpStatus: 0,
                }
              : x,
          ),
        );
        return;
      }
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const msg =
        typeof json.error === "string"
          ? json.error
          : typeof json.message === "string"
            ? json.message
            : "Unable to scan paper";
      const code = typeof json.code === "string" ? json.code : undefined;
      if (!res.ok) {
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id ? { ...x, phase: "error", errorShort: msg, httpStatus: res.status, code } : x,
          ),
        );
        return;
      }
      const data = json.data as { persistedMarks?: number; feedback?: string } | undefined;
      setGradeSavedSignal((n) => n + 1);
      setJobs((prev) =>
        prev.map((x) =>
          x.id === job.id
            ? {
                ...x,
                phase: "success",
                marks: typeof data?.persistedMarks === "number" ? data.persistedMarks : undefined,
                feedback: typeof data?.feedback === "string" ? data.feedback : undefined,
              }
            : x,
        ),
      );
    },
    [examId, maxMarks, studentId],
  );

  const processBatch = useCallback(
    async (batch: Job[]) => {
      setRunning(true);
      try {
        for (const j of batch) {
          setJobs((prev) =>
            prev.map((x) => (x.id === j.id ? { ...x, phase: "processing" as const } : x)),
          );
          await runOne({ ...j, phase: "processing" });
        }
      } finally {
        setRunning(false);
      }
    },
    [runOne],
  );

  const onPickFiles = (list: FileList | null) => {
    if (!list?.length || !studentId || !examId) return;
    const next: Job[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (!file.type.startsWith("image/")) continue;
      next.push({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        phase: "queued",
      });
    }
    if (!next.length) return;
    setJobs((prev) => [...prev, ...next]);
    void processBatch(next);
  };

  const retryJob = async (job: Job) => {
    setJobs((prev) =>
      prev.map((x) =>
        x.id === job.id ? { ...x, phase: "queued", errorShort: undefined, httpStatus: undefined, code: undefined } : x,
      ),
    );
    await processBatch([{ ...job, phase: "queued" }]);
  };

  const rosterMissing = students.length === 0 || exams.length === 0;

  return (
    <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ProcessingOverlay open={showProcessingOverlay} />

      <GradeSaveSuccessOverlay signal={gradeSavedSignal} />

      <section className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 shadow-xl shadow-black/25 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Upload answer sheets</h2>
            <p className="mt-1 text-sm text-slate-400">
              Multi-file queue · each image POSTs to `/api/scan-paper` under your signed-in school.
            </p>
          </div>
          {sessionSchoolId ? (
            <span className="rounded-md border border-emerald-500/25 bg-emerald-950/30 px-2 py-1 font-mono text-[11px] text-emerald-200">
              schoolId {sessionSchoolId.slice(0, 8)}…
            </span>
          ) : (
            <span className="text-xs text-amber-300">Assign a school to your teacher account.</span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Student
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-teal-500/40"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={running}
            >
              <option value="">Select learner</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.rollNo ? ` · ${s.rollNo}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Exam
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-teal-500/40"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              disabled={running}
            >
              <option value="">Select exam</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.dateLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Max marks
            <input
              type="number"
              min={1}
              max={1000}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-teal-500/40"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
              disabled={running}
            />
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950/60 px-4 py-10 text-center transition hover:border-teal-500/40 hover:bg-slate-900/80">
            <Upload className="mx-auto size-9 text-teal-400" aria-hidden />
            <span className="mt-3 text-sm font-medium text-slate-200">Drop images or browse</span>
            <span className="mt-1 text-xs text-slate-500">Queued sequentially with live status.</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={rosterMissing || running || !studentId || !examId}
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {rosterMissing ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-sm text-amber-100">
              Seed students and exams for this school before scanning.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-5 shadow-xl shadow-black/25 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Live progress</h2>
            <p className="mt-1 text-sm text-slate-400">Processing → Success → marks saved (per image).</p>
          </div>
          {running ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-teal-200">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Running
            </span>
          ) : null}
        </div>

        <ul className="mt-6 space-y-3">
          {jobs.length === 0 ? (
            <li className="rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-6 text-center text-sm text-slate-500">
              No jobs yet.
            </li>
          ) : (
            jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-slate-800/90 bg-slate-950/60 px-4 py-3 shadow-inner shadow-black/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">{job.fileName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {job.phase === "queued" ? (
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300">Queued</span>
                      ) : null}
                      {job.phase === "processing" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/50 px-2 py-0.5 text-amber-200 ring-1 ring-amber-500/30">
                          <Loader2 className="size-3 animate-spin" aria-hidden />
                          Processing
                        </span>
                      ) : null}
                      {job.phase === "success" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/40 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-500/30">
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Success
                        </span>
                      ) : null}
                      {job.phase === "error" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/40 px-2 py-0.5 text-rose-200 ring-1 ring-rose-500/35">
                          <AlertCircle className="size-3.5" aria-hidden />
                          Error
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {job.phase === "success" && typeof job.marks === "number" ? (
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums text-white">{job.marks}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Marks</p>
                    </div>
                  ) : null}
                </div>

                {job.phase === "success" && job.feedback ? (
                  <p className="mt-3 line-clamp-4 border-t border-slate-800/80 pt-3 text-sm leading-relaxed text-slate-400">
                    {job.feedback}
                  </p>
                ) : null}

                {job.phase === "error" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-3">
                    <p className="flex-1 text-sm text-rose-100/90">{job.errorShort ?? "Something went wrong."}</p>
                    {job.httpStatus === 402 ? (
                      <Link
                        href="/pricing"
                        className="inline-flex items-center rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-950/70"
                      >
                        Plans
                      </Link>
                    ) : null}
                    {job.httpStatus !== undefined && canRetry(job.httpStatus, job.code) ? (
                      <button
                        type="button"
                        onClick={() => void retryJob(job)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-950/40 px-3 py-1.5 text-xs font-medium text-teal-100 transition hover:bg-teal-950/70"
                      >
                        <RefreshCw className="size-3.5" aria-hidden />
                        Retry
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
