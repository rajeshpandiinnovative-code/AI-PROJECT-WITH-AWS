import Link from "next/link";

import { auth } from "@/auth";
import { PilotNav } from "@/src/components/PilotNav";
import { updateStudentMarks } from "@/src/app/actions/results";
import { isOnboardingDemoSeedEnabled } from "@/src/lib/env";
import { ensurePilotDemoForSchool } from "@/src/lib/pilot-seed";

import { ScanExperience } from "./scan-experience";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const session = await auth();
  let defaultStudentId = "";
  let defaultExamId = "";

  if (session?.user?.schoolId && isOnboardingDemoSeedEnabled()) {
    const demo = await ensurePilotDemoForSchool(session.user.schoolId);
    defaultStudentId = demo.demoStudentId;
    defaultExamId = demo.demoExamId;
  }

  async function confirmMarksAction(studentId: string, examId: string, marks: number) {
    "use server";
    await updateStudentMarks(studentId, examId, marks);
  }

  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-white">Pinnacle — Scan &amp; evaluate</h1>
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">Workflow:</span> capture the answer sheet → auto-grade with
              your institutional rubric (Vision + Gemini) → confirm to save marks to your ledger.
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm font-medium text-emerald-400 underline-offset-4 hover:underline"
            >
              ← Back to marketing site
            </Link>
          </div>
          <PilotNav />
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B] p-4 sm:p-6">
          <ScanExperience
            defaultStudentId={defaultStudentId}
            defaultExamId={defaultExamId}
            onConfirmSave={confirmMarksAction}
          />
        </div>
      </div>
    </div>
  );
}
