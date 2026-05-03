import { Scanner } from "@/src/components/Scanner";
import { updateStudentMarks } from "@/src/app/actions/results";

export default function Home() {
  async function confirmMarksAction(studentId: string, examId: string, marks: number) {
    "use server";
    await updateStudentMarks(studentId, examId, marks);
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <main className="w-full max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">OASIS-TN Scan and Auto-Grade</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pilot flow: capture answer sheet, auto-grade with rubric, then confirm to save marks.
        </p>
        <Scanner onConfirmSave={confirmMarksAction} />
      </main>
    </div>
  );
}
