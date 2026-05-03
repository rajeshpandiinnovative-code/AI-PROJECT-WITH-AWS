"use client";

import { useRef, useState } from "react";

type GradeResponse = {
  score: number;
  feedback: string;
};

type ScannerProps = {
  onConfirmSave: (studentId: string, examId: string, marks: number) => Promise<void>;
};

export function Scanner({ onConfirmSave }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

    setIsLoading(true);
    setStatus("AI grading in progress...");
    setGradeResult(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture frame.");
      }

      // Capture at native/high camera resolution.
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const payload = (await response.json()) as GradeResponse | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Grading failed.");
      }

      setGradeResult(payload);
      setStatus("Grading completed. Review and confirm.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to grade paper.");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmAndSave() {
    if (!gradeResult) {
      setStatus("No score to save.");
      return;
    }

    setIsLoading(true);
    setStatus("Saving score...");
    try {
      await onConfirmSave(studentId, examId, gradeResult.score);
      setStatus("Score saved successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save score.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold">Scanner</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Capture answer sheet, auto-grade it, then confirm and save marks.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className="rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="studentId (uuid)"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        />
        <input
          className="rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="examId (uuid)"
          value={examId}
          onChange={(event) => setExamId(event.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startCamera}
          className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          Start Camera
        </button>
        <button
          type="button"
          onClick={stopCamera}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        >
          Stop Camera
        </button>
        <button
          type="button"
          onClick={gradePaper}
          disabled={isLoading}
          className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
        >
          Grade Paper
        </button>
        <button
          type="button"
          onClick={confirmAndSave}
          disabled={isLoading || !gradeResult}
          className="rounded border border-emerald-500 px-3 py-2 text-sm text-emerald-700 disabled:opacity-60 dark:text-emerald-400"
        >
          Confirm & Save
        </button>
      </div>

      <video ref={videoRef} className="mt-4 w-full rounded bg-black" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {isLoading ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          AI grading...
        </div>
      ) : null}

      {previewImage ? (
        // Runtime data URL preview from captured frame.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewImage} alt="Captured answer sheet preview" className="mt-4 w-full rounded" />
      ) : null}

      {gradeResult ? (
        <div className="mt-4 space-y-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <p>
            <strong>Score:</strong> {gradeResult.score}
          </p>
          <p>
            <strong>Feedback:</strong> {gradeResult.feedback}
          </p>
        </div>
      ) : null}

      {status ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{status}</p> : null}
    </section>
  );
}

