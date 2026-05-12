"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { GradeSaveSuccessOverlay } from "@/src/components/lottie/GradeSaveSuccessOverlay";
import { ProcessingOverlay } from "@/src/components/lottie/ProcessingOverlay";

type GradeResponse = {
  score: number;
  feedback: string;
};

type ScannerProps = {
  onConfirmSave: (studentId: string, examId: string, marks: number) => Promise<void>;
  /** Optional defaults for local/demo onboarding flows. */
  defaultStudentId?: string;
  defaultExamId?: string;
};

export function Scanner({ onConfirmSave, defaultStudentId = "", defaultExamId = "" }: ScannerProps) {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [studentId, setStudentId] = useState(defaultStudentId);
  const [examId, setExamId] = useState(defaultExamId);
  const [busyPhase, setBusyPhase] = useState<"idle" | "grading" | "saving">("idle");

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [gradeSavedSignal, setGradeSavedSignal] = useState(0);

  const isTeacher = session?.user?.role === "TEACHER";
  const showHandwritingOverlay = busyPhase === "grading" && isTeacher;

  async function startCamera() {
    if (streamRef.current) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  function stopCamera() {
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
  }

  async function gradePaper() {
    if (!videoRef.current || !canvasRef.current) {
      setStatus("Camera is not ready.");
      return;
    }

    if (!studentId || !examId) {
      setStatus("studentId and examId are required.");
      return;
    }

    setBusyPhase("grading");
    setStatus("AI grading in progress...");
    setGradeResult(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture frame.");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setPreviewImage(dataUrl);

      const imageBase64 = dataUrl.split(",")[1];
      if (!imageBase64) {
        throw new Error("Invalid captured image.");
      }

      const response = await fetch("/api/grade", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const payload = (await response.json()) as GradeResponse | { error: string };
      if (!response.ok || "error" in payload) {
        if (response.status === 401) {
          throw new Error("Session required — use Claim your school, then return to Scan.");
        }
        if (response.status === 402) {
          if (typeof window !== "undefined") {
            window.location.assign("/pricing?reason=subscription");
          }
          throw new Error("Active subscription required for grading.");
        }
        throw new Error("error" in payload ? payload.error : "Grading failed.");
      }

      setGradeResult(payload);
      setStatus("Grading completed. Review and confirm.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to grade paper.");
    } finally {
      setBusyPhase("idle");
    }
  }

  async function confirmAndSave() {
    if (!gradeResult) {
      setStatus("No score to save.");
      return;
    }

    setBusyPhase("saving");
    setStatus("Saving score...");
    try {
      await onConfirmSave(studentId, examId, gradeResult.score);
      setGradeSavedSignal((n) => n + 1);
      setStatus("Score saved successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save score.");
    } finally {
      setBusyPhase("idle");
    }
  }

  const isBusy = busyPhase !== "idle";

  return (
    <section className="relative w-full max-w-3xl rounded-xl border border-slate-600 bg-[#0F172A]/60 p-4 shadow-sm sm:p-6">
      <ProcessingOverlay open={showHandwritingOverlay} />

      <GradeSaveSuccessOverlay signal={gradeSavedSignal} />

      <h2 className="text-xl font-semibold text-white">Answer sheet workspace</h2>
      <p className="mt-1 text-sm text-slate-400">
        Use <strong className="font-medium text-slate-300">Start camera</strong>, then{" "}
        <strong className="font-medium text-slate-300">Grade paper</strong>, review the result, and{" "}
        <strong className="font-medium text-slate-300">Confirm &amp; save</strong>. In production, enter real student
        and exam IDs from your school records.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-lg border border-slate-600 bg-slate-900/80 p-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          placeholder="studentId (uuid)"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        />
        <input
          className="rounded-lg border border-slate-600 bg-slate-900/80 p-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          placeholder="examId (uuid)"
          value={examId}
          onChange={(event) => setExamId(event.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="rounded-lg bg-[#10B981] px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#059669]"
        >
          Start Camera
        </button>
        <button
          type="button"
          onClick={stopCamera}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Stop Camera
        </button>
        <button
          type="button"
          onClick={gradePaper}
          disabled={isBusy}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          Grade Paper
        </button>
        <button
          type="button"
          onClick={confirmAndSave}
          disabled={isBusy || !gradeResult}
          className="rounded-lg border border-emerald-500/80 px-3 py-2 text-sm font-medium text-emerald-300 disabled:opacity-60"
        >
          Confirm & Save
        </button>
      </div>

      <video ref={videoRef} className="mt-4 w-full rounded-lg bg-black" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {busyPhase === "saving" ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          Saving…
        </div>
      ) : null}

      {previewImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewImage} alt="Captured answer sheet preview" className="mt-4 w-full rounded-lg" />
      ) : null}

      {gradeResult ? (
        <div className="mt-4 space-y-2 rounded-lg border border-slate-600 bg-slate-900/50 p-3 text-sm text-slate-200">
          <p>
            <strong>Score:</strong> {gradeResult.score}
          </p>
          <p>
            <strong>Feedback:</strong> {gradeResult.feedback}
          </p>
        </div>
      ) : null}

      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
    </section>
  );
}
