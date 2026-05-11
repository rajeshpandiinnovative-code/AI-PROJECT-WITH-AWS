"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { analyticsEvents, schools } from "@/src/db/schema";
import { db } from "@/src/lib/db";
import { requireFounder } from "@/src/lib/founder-access";
import { isAllowedGlobalGeminiTextModel, setGlobalGeminiTextModel } from "@/src/lib/gemini-runtime-model";
import { IMPERSONATE_TENANT_COOKIE } from "@/src/lib/rbac";

const tenantIdSchema = z.string().uuid();

export async function impersonateTenantAction(formData: FormData) {
  await requireFounder();
  const tenantId = tenantIdSchema.parse(String(formData.get("tenantId") ?? "").trim());

  const store = await cookies();
  store.set(IMPERSONATE_TENANT_COOKIE, tenantId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  redirect("/school/dashboard");
}

export async function clearImpersonationAction() {
  await requireFounder();
  const store = await cookies();
  store.delete(IMPERSONATE_TENANT_COOKIE);
  redirect("/admin/schools");
}

export async function createTenantAction(formData: FormData) {
  await requireFounder();
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const board = String(formData.get("board") ?? "MATRIC").trim();

  if (!name || !location || !board) {
    redirect("/admin/schools?error=missing");
  }

  const safeUdise = `AUTO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

  await db.insert(schools).values({
    name,
    district: location,
    board,
    udiseCode: safeUdise,
    subscriptionStatus: "trial",
  });

  redirect("/admin/schools?created=1");
}

export async function setAiModelAction(formData: FormData) {
  await requireFounder();
  const model = String(formData.get("model") ?? "").trim();
  if (!isAllowedGlobalGeminiTextModel(model)) {
    redirect("/admin/dashboard?modelError=1");
  }
  await setGlobalGeminiTextModel(model);
  await db.insert(analyticsEvents).values({
    eventType: "admin_gemini_model_changed",
    payload: { model },
  });
  redirect("/admin/dashboard?modelUpdated=1");
}
