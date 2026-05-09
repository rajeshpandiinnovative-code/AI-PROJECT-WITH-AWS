"use client";

import { useMemo, useRef, useState } from "react";

type ScanResult = {
  extractedText: string;
  suggestedMarks: number;
  feedback: string;
  confidence: number;
  reasons: string[];
};

type ScanPaperPanelProps = {
  onConfirmMarks: (studentId: string, examId: string, marks: number) => Promise<void>;
};

const CONFIDENCE_THRESHOLD = 0.6;

export function ScanPaperPanel({ onConfirmMarks }: ScanPaperPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const confidenceWarning = useMemo(() => {
    if (!result) {
      return null;
    }

    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      return null;
    }

    return `Low confidence (${(result.confidence * 100).toFixed(0)}%). Please manually review before confirming.`;
  }, [result]);

  async function startCamera() {
    if (streamRef.current) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  function stopCamera() {
    if (!streamRef.current) {
      return;
    }

    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }

    streamRef.current = null;
  }

  async function captureFrame() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      setStatus("Unable to capture image.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setResult(null);
    setStatus("Image captured. Click Analyze Paper.");
    stopCamera();
  }

  async function analyzePaper() {
    if (!imageBlob) {
      setStatus("Capture an image first.");
      return;
    }

    if (!studentId || !examId) {
      setStatus("studentId and examId are required.");
      return;
    }

    setIsBusy(true);
    setStatus("Analyzing paper...");

    try {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("examId", examId);
      formData.set("maxMarks", maxMarks || "100");
      formData.set("image", imageBlob, "answer-sheet.jpg");

      const response = await fetch("/api/scan-paper", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = (await response.json()) as
        | { data: ScanResult; error?: never }
        | { error: string; data?: never };

      if (!response.ok || "error" in payload) {
        if (response.status === 402) {
          if (typeof window !== "undefined") {
            window.location.assign("/pricing?reason=subscription");
          }
          throw new Error("Active subscription required for AI scan.");
        }
        throw new Error("error" in payload ? payload.error : "Scan failed");
      }

      setResult(payload.data);
      setStatus("AI analysis complete. Review and confirm.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to analyze paper.");
      setResult(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmMarks() {
    if (!result) {
      setStatus("No suggested marks to confirm.");
      return;
    }

    setIsBusy(true);
    setStatus("Saving marks...");

    try {
      await onConfirmMarks(studentId, examId, result.suggestedMarks);
      setStatus("Marks updated successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update marks.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold">Scan paper</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Pinnacle workflow: capture → rubric-based auto-grade → confirm final marks.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
        <input
          className="rounded border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="max marks"
          value={maxMarks}
          onChange={(event) => setMaxMarks(event.target.value)}
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
          onClick={captureFrame}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        >
          Capture
        </button>
        <button
          type="button"
          onClick={analyzePaper}
          disabled={isBusy}
          className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
        >
          Analyze Paper
        </button>
        <button
          type="button"
          onClick={confirmMarks}
          disabled={isBusy || !result}
          className="rounded border border-emerald-500 px-3 py-2 text-sm text-emerald-700 disabled:opacity-60 dark:text-emerald-400"
        >
          Confirm Marks
        </button>
      </div>

      <video ref={videoRef} className="mt-4 w-full rounded bg-black" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {previewUrl ? (
        // Blob preview is generated at runtime from camera capture.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Captured answer sheet" className="mt-4 w-full rounded" />
      ) : null}

      {result ? (
        <div className="mt-4 space-y-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          <p>
            <strong>Suggested Marks:</strong> {result.suggestedMarks}
          </p>
          <p>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Feedback:</strong> {result.feedback}
          </p>
          <p>
            <strong>Extracted Text:</strong> {result.extractedText}
          </p>
        </div>
      ) : null}

      {confidenceWarning ? (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{confidenceWarning}</p>
      ) : null}

      {status ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{status}</p> : null}
    </section>
  );
}

