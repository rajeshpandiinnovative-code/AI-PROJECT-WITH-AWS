"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn, useSession } from "next-auth/react";

import type { DevSessionUpdate } from "@/src/lib/dev-session";
import { DEV_SWITCHABLE_ROLES } from "@/src/lib/dev-session";
import { DEV_MASTER_OTP_CLIENT, PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT } from "@/src/lib/dev-auth-public";
import { primaryDashboardPathForPlatformRole } from "@/src/lib/post-login-redirect";

type SchoolRow = { id: string; name: string };
type StudentRow = { id: string; name: string; rollNo: string };

function devSwitcherMobileFromEnv(): string {
  const raw = typeof process.env.NEXT_PUBLIC_DEV_SWITCHER_MOBILE === "string"
    ? process.env.NEXT_PUBLIC_DEV_SWITCHER_MOBILE
    : "";
  return raw.replace(/\D/g, "").slice(-10);
}

function normalizePhone10(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

/** Detect OTP mistakenly pasted into the phone field (e.g. dev master OTP `123456`). */
function looksLikeOtpNotPhone(digits: string): boolean {
  if (digits.length !== 6) return false;
  return digits === DEV_MASTER_OTP_CLIENT || /^(\d)\1{5}$/.test(digits);
}

export function DevSwitcher() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [studentCache, setStudentCache] = useState<{ schoolId: string; rows: StudentRow[] } | null>(null);
  const [role, setRole] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [linkedStudentId, setLinkedStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When no JWT: optional manual mobile for master-OTP sign-in (same row must exist on platform_users). */
  const [manualDevPhone, setManualDevPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/dev/schools");
        if (!res.ok) return;
        const data = (await res.json()) as { schools?: SchoolRow[] };
        if (!cancelled && Array.isArray(data.schools)) {
          setSchools(data.schools);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/dev/students?schoolId=${encodeURIComponent(schoolId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { students?: StudentRow[] };
        if (!cancelled && Array.isArray(data.students)) {
          setStudentCache({ schoolId, rows: data.students });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  useEffect(() => {
    queueMicrotask(() => {
      const r = session?.user?.role;
      const s = session?.user?.schoolId;
      const l = session?.user?.linkedStudentId;
      if (typeof r === "string") setRole(r);
      if (typeof s === "string") setSchoolId(s);
      if (typeof l === "string") setLinkedStudentId(l);
    });
  }, [session?.user?.role, session?.user?.schoolId, session?.user?.linkedStudentId]);

  const visibleStudents =
    schoolId && studentCache?.schoolId === schoolId ? studentCache.rows : [];

  const ensureDevCredentialsSession = useCallback(async (): Promise<boolean> => {
    if (process.env.NODE_ENV !== "development") {
      setError("Dev bypass only runs in development.");
      return false;
    }
    const s = await getSession();
    if (s?.user) return true;

    const rawDigits = manualDevPhone.replace(/\D/g, "");
    if (!devSwitcherMobileFromEnv() && looksLikeOtpNotPhone(rawDigits)) {
      setError(
        `That looks like an OTP, not a mobile number. Enter the 10-digit phone on your platform_users row (OTP ${DEV_MASTER_OTP_CLIENT} is sent automatically).`,
      );
      return false;
    }

    const phone = devSwitcherMobileFromEnv() || normalizePhone10(manualDevPhone);
    if (phone.length !== 10) {
      setError(
        "Enter a 10-digit mobile that exists on platform_users.phone_number (or set NEXT_PUBLIC_DEV_SWITCHER_MOBILE). Do not type the OTP here.",
      );
      return false;
    }

    const signRes = await signIn("credentials", {
      phoneNumber: phone,
      otp: DEV_MASTER_OTP_CLIENT,
      redirect: false,
    });

    if (signRes?.error) {
      setError(
        `Dev sign-in failed. Run npm run seed:local-pilot (sets phones like ${PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT} for MANAGEMENT School A), or set DEV_MASTER_SIGNIN_EMAIL=pilot-owner-a@local.test in .env.local and use master OTP ${DEV_MASTER_OTP_CLIENT} with any 10-digit phone field.`,
      );
      return false;
    }

    await getSession();
    return true;
  }, [manualDevPhone]);

  const apply = useCallback(async () => {
    if (process.env.NODE_ENV !== "development") return;

    setBusy(true);
    setError(null);
    try {
      const authed = status === "authenticated" ? true : await ensureDevCredentialsSession();
      if (!authed) {
        setBusy(false);
        return;
      }

      const payload: DevSessionUpdate = {};
      if (role) payload.devRoleOverride = role;
      if (schoolId) payload.devSchoolIdOverride = schoolId;
      if (linkedStudentId.trim()) {
        payload.devLinkedStudentIdOverride = linkedStudentId.trim();
      } else {
        payload.devLinkedStudentIdOverride = null;
      }

      await update(payload as Parameters<typeof update>[0]);

      const effectiveRole =
        (role.trim() ? role : undefined) ??
        payload.devRoleOverride ??
        session?.user?.role;
      const target =
        typeof effectiveRole === "string" && effectiveRole.trim()
          ? primaryDashboardPathForPlatformRole(effectiveRole)
          : "/dashboard";

      window.location.assign(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }, [role, schoolId, linkedStudentId, update, session, status, ensureDevCredentialsSession]);

  const clearOverrides = useCallback(async () => {
    if (process.env.NODE_ENV !== "development") return;

    setBusy(true);
    setError(null);
    try {
      if (status !== "authenticated") {
        const ok = await ensureDevCredentialsSession();
        if (!ok) {
          setBusy(false);
          return;
        }
      }
      await update({ clearDevSessionOverrides: true } as Parameters<typeof update>[0]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setBusy(false);
    }
  }, [update, router, status, ensureDevCredentialsSession]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const authHint =
    status !== "authenticated"
      ? `No JWT yet — enter your 10-digit platform mobile below (not the OTP). Apply signs you in with dev OTP ${DEV_MASTER_OTP_CLIENT} automatically.`
      : null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-lg border border-amber-500/40 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-xl shadow-black/40 backdrop-blur">
      <p className="mb-2 font-semibold uppercase tracking-wide text-amber-300">Dev session switcher</p>
      <p className="mb-2 text-[11px] leading-snug text-slate-400">
        Development only. Overrides JWT role / tenant via <code className="text-slate-300">session.update()</code>; Apply
        navigates to the matching dashboard (e.g. MANAGEMENT → /management/dashboard).
      </p>
      {authHint ? <p className="mb-2 text-[11px] text-amber-200/95">{authHint}</p> : null}

      <div className="flex flex-col gap-2">
        {status !== "authenticated" ? (
          <label className="flex flex-col gap-0.5">
            <span className="text-slate-500">Phone number (10 digits)</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={`Pilot seed MANAGEMENT A: ${PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT}`}
              value={manualDevPhone}
              onChange={(e) => setManualDevPhone(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 placeholder:text-slate-600"
            />
            <span className="text-[10px] leading-snug text-slate-500">
              Do not enter <span className="font-mono text-slate-400">{DEV_MASTER_OTP_CLIENT}</span> here — that is the
              dev OTP; it is applied automatically when you click Apply.
            </span>
          </label>
        ) : null}
        <label className="flex flex-col gap-0.5">
          <span className="text-slate-500">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            <option value="">(unchanged)</option>
            {DEV_SWITCHABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-slate-500">School (tenant)</span>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            <option value="">— pick school —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-slate-500">Linked student (STUDENT tests)</span>
          <select
            value={linkedStudentId}
            onChange={(e) => setLinkedStudentId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            <option value="">— none / DB value —</option>
            {visibleStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.rollNo} · {st.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void apply()}
            className="rounded bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Apply & go to dashboard
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearOverrides()}
            className="rounded border border-slate-600 px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Clear overrides
          </button>
        </div>
        {error ? <p className="text-red-400">{error}</p> : null}
        <p className="mt-1 border-t border-slate-800 pt-2 text-[10px] text-slate-500">
          Session: {session?.user?.role ?? "—"} · school{" "}
          <span className="font-mono text-slate-400">{(session?.user?.schoolId ?? "").slice(0, 8) || "—"}</span>
        </p>
      </div>
    </div>
  );
}
