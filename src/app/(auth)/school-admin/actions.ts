"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSchoolAdminSession } from "@/src/components/school-admin/school-admin-access";
import { schoolModuleGradePolicies, students } from "@/src/db/schema";
import { db } from "@/src/lib/db";

const rowSchema = z.object({
  name: z.string().min(1).max(255),
  rollNo: z.string().min(1).max(64),
  section: z.string().max(64).optional(),
  boardRegistrationNo: z.string().max(128).optional(),
});

export async function importStudentsCsvAction(formData: FormData): Promise<void> {
  const { tenantId } = await requireSchoolAdminSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/school-admin?import=no_file");
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    redirect("/school-admin?import=empty");
  }

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name") && header.includes("roll");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name, rollNo, section, boardRegistrationNo] = [
      parts[0] ?? "",
      parts[1] ?? "",
      parts[2] ?? "",
      parts[3] ?? "",
    ];
    const parsed = rowSchema.safeParse({
      name,
      rollNo,
      section: section || undefined,
      boardRegistrationNo: boardRegistrationNo || undefined,
    });
    if (!parsed.success) {
      errors.push(`Row ${i + 1}: invalid data`);
      continue;
    }
    try {
      await db.insert(students).values({
        name: parsed.data.name,
        rollNo: parsed.data.rollNo,
        schoolId: tenantId,
        section: parsed.data.section ?? null,
        boardRegistrationNo: parsed.data.boardRegistrationNo ?? null,
      });
      inserted += 1;
    } catch {
      errors.push(`Row ${i + 1}: could not insert (duplicate roll or DB error)`);
    }
  }

  revalidatePath("/school-admin");
  const errQ = errors.length ? `&errs=${errors.length}` : "";
  redirect(`/school-admin?imported=${inserted}${errQ}`);
}

export async function setModuleGradePolicyAction(formData: FormData): Promise<void> {
  const { tenantId } = await requireSchoolAdminSession();
  const gradeLabel = String(formData.get("gradeLabel") ?? "").trim();
  const moduleSlug = String(formData.get("moduleSlug") ?? "").trim();
  const enabledRaw = String(formData.get("enabled") ?? "true");
  const enabled = enabledRaw === "true" || enabledRaw === "on";

  if (!gradeLabel || !moduleSlug) {
    return;
  }

  const now = new Date();
  await db
    .insert(schoolModuleGradePolicies)
    .values({
      schoolId: tenantId,
      gradeLabel,
      moduleSlug,
      enabled,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        schoolModuleGradePolicies.schoolId,
        schoolModuleGradePolicies.gradeLabel,
        schoolModuleGradePolicies.moduleSlug,
      ],
      set: { enabled, updatedAt: now },
    });

  revalidatePath("/school-admin");
}
