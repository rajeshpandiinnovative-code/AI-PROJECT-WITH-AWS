"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { Scanner } from "@/src/components/Scanner";

type ScanExperienceProps = {
  defaultStudentId: string;
  defaultExamId: string;
  onConfirmSave: (studentId: string, examId: string, marks: number) => Promise<void>;
};

export function ScanExperience({ defaultStudentId, defaultExamId, onConfirmSave }: ScanExperienceProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-400">
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          Loading session…
        </span>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-amber-100">Session required for scanning</p>
        <p className="mt-2 text-sm text-amber-200/90">
          Claim your school to activate your tenant — then grading APIs run under your institution&apos;s context.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-xl bg-[#10B981] px-6 text-base font-semibold text-[#0F172A] shadow-lg shadow-emerald-900/30 transition hover:bg-[#059669]"
        >
          Claim your school
        </Link>
      </div>
    );
  }

  return (
    <Scanner
      key={`${defaultStudentId}:${defaultExamId}`}
      onConfirmSave={onConfirmSave}
      defaultStudentId={defaultStudentId}
      defaultExamId={defaultExamId}
    />
  );
}
