"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { globalSchools, platformUsers, schools } from "@/src/db/schema";

export type ClaimSchoolResult =
  | { ok: true; schoolId: string }
  | { ok: false; error: string };

/**
 * Claim a national-directory school by UDISE: creates the tenant `schools` row and binds the user as `MANAGEMENT`.
 */
export async function claimGlobalSchool(udiseCode: string, userId: string): Promise<ClaimSchoolResult> {
  const code = udiseCode.trim();
  if (!code) {
    return { ok: false, error: "UDISE code is required." };
  }

  const [claimed] = await db.select({ id: schools.id }).from(schools).where(eq(schools.udiseCode, code)).limit(1);
  if (claimed) {
    return {
      ok: false,
      error:
        "This school has already been claimed. If you belong here, ask your administrator for an invite, or verify the UDISE code.",
    };
  }

  const [globalRow] = await db.select().from(globalSchools).where(eq(globalSchools.udiseCode, code)).limit(1);
  if (!globalRow) {
    return {
      ok: false,
      error: "No national directory entry was found for that UDISE code. Check the code and try again.",
    };
  }

  const [user] = await db.select({ id: platformUsers.id }).from(platformUsers).where(eq(platformUsers.id, userId)).limit(1);
  if (!user) {
    return { ok: false, error: "User account not found." };
  }

  const district = (globalRow.districtName ?? "India").slice(0, 128);
  const name = (globalRow.schoolName ?? "School").slice(0, 255);
  const boardRaw = (globalRow.boardName ?? "MATRIC").trim();
  const board = (boardRaw.length > 0 ? boardRaw : "MATRIC").slice(0, 128);

  try {
    const [newSchool] = await db
      .insert(schools)
      .values({
        udiseCode: code.slice(0, 32),
        name,
        district,
        board,
      })
      .returning({ id: schools.id });

    if (!newSchool) {
      return { ok: false, error: "Could not create the school. Please try again." };
    }

    await db
      .update(platformUsers)
      .set({
        schoolId: newSchool.id,
        role: "MANAGEMENT",
        updatedAt: new Date(),
      })
      .where(eq(platformUsers.id, userId));

    return { ok: true, schoolId: newSchool.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return {
        ok: false,
        error:
          "This school has already been claimed by another account. Verify the UDISE code or contact support.",
      };
    }
    throw err;
  }
}
