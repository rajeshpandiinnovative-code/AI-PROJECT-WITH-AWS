"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormFrame } from "@/src/components/ui/FormFrame";
import { BILLING_BOARD_PRESETS } from "@/src/lib/board-billing";
import {
  PLATFORM_ROLE_LABELS,
  SELECTABLE_PLATFORM_ROLES,
  type PlatformRole,
} from "@/src/lib/platform-roles";

type RegisterErrorPayload = {
  error?: string;
  details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
};

function formatRegisterApiError(payload: RegisterErrorPayload): string {
  const fe = payload.details?.fieldErrors;
  if (fe && Object.keys(fe).length > 0) {
    const parts = Object.entries(fe)
      .filter(([, msgs]) => msgs?.length)
      .map(([field, msgs]) => `${field}: ${msgs!.join(", ")}`);
    if (parts.length) {
      return `${payload.error ?? "Invalid"} — ${parts.join("; ")}`;
    }
  }
  const formErrors = payload.details?.formErrors?.filter(Boolean);
  if (formErrors?.length) {
    return `${payload.error ?? "Invalid"} — ${formErrors.join("; ")}`;
  }
  return payload.error ?? "Registration failed";
}

function fieldErrorsFromApi(details: RegisterErrorPayload["details"]): Record<string, string> {
  const out: Record<string, string> = {};
  const fe = details?.fieldErrors;
  if (!fe) {
    return out;
  }
  for (const [key, msgs] of Object.entries(fe)) {
    if (msgs?.[0]) {
      out[key] = msgs[0];
    }
  }
  return out;
}

/** Align with Zod / Postgres `uuid` validation for optional school link. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared with demo login: compact control styling. */
const demoControlClass =
  "mt-1 w-full min-h-[42px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500";

export function RegisterAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<PlatformRole>(SELECTABLE_PLATFORM_ROLES[0] ?? "TEACHER");
  const [schoolLinkMode, setSchoolLinkMode] = useState<"none" | "id">("none");
  const [schoolId, setSchoolId] = useState("");
  const [boardSelect, setBoardSelect] = useState<string>(BILLING_BOARD_PRESETS[0]?.key ?? "MATRIC");
  const [customBoard, setCustomBoard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};

    const nameTrim = displayName.trim();
    const emailTrim = email.trim();
    if (!nameTrim) {
      nextErrors.displayName = "Display name is required.";
    }

    const digits = phoneNumber.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      nextErrors.phoneNumber = "Enter a valid 10-digit mobile number.";
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (emailTrim && !EMAIL_RE.test(emailTrim)) {
      nextErrors.email = "Enter a valid email address.";
    }

    let board = "";
    if (boardSelect === "__custom__") {
      board = customBoard.trim();
      if (!board) {
        nextErrors.board = "Describe your curriculum board or choose a preset above.";
      }
    } else {
      board = boardSelect.trim();
      if (!board) {
        nextErrors.board = "Curriculum board is required.";
      }
    }

    const sid = schoolLinkMode === "id" ? schoolId.trim() : "";
    if (schoolLinkMode === "id") {
      if (!sid) {
        nextErrors.schoolId = "School tenant UUID is required when linking to a school.";
      } else if (!UUID_RE.test(sid)) {
        nextErrors.schoolId = "Enter a valid school UUID (from onboarding).";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setBusy(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        phoneNumber: digits,
        password,
        displayName: nameTrim,
        role,
        board,
      };
      if (emailTrim) {
        body.email = emailTrim.toLowerCase();
      }
      if (sid) {
        body.schoolId = sid;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let payload: RegisterErrorPayload = {};
      try {
        payload = (await res.json()) as RegisterErrorPayload;
      } catch {
        setError(`Registration failed (${res.status}).`);
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const apiFields = fieldErrorsFromApi(payload.details);
        if (Object.keys(apiFields).length > 0) {
          setFieldErrors(apiFields);
        }
        const msg = formatRegisterApiError(payload);
        setError(
          res.status === 500 && /connect|ECONNREFUSED|timeout|ENOTFOUND/i.test(msg)
            ? `${msg} — Check DATABASE_URL and that Postgres is running if you're local.`
            : Object.keys(apiFields).length > 0
              ? "Fix the highlighted fields."
              : msg,
        );
        setBusy(false);
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Registration failed.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">AI Coaching Centre</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Create account</h1>
          <p className="mt-3 text-sm text-slate-400">
            Required fields are marked with <span className="text-rose-400">*</span>. Data is stored on{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-slate-300">platform_users</code>. Sign in
            with email + password (your email below, or{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-slate-300">
              user-&lt;10-digit mobile&gt;@phone.aap.local
            </code>
            ).
          </p>
          <div className="mt-5 rounded-xl border border-slate-700/90 bg-slate-900/50 px-4 py-4 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/95">This form collects</p>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-slate-400 marker:text-emerald-500/80">
              <li>
                <span className="text-slate-200">Your name</span> → <code className="text-xs text-slate-400">display_name</code>
              </li>
              <li>
                <span className="text-slate-200">Mobile (10 digits)</span> →{" "}
                <code className="text-xs text-slate-400">phone_number</code>
              </li>
              <li>
                <span className="text-slate-200">Email</span> (optional) → <code className="text-xs text-slate-400">email</code>
              </li>
              <li>
                <span className="text-slate-200">Password</span> → <code className="text-xs text-slate-400">password_hash</code>{" "}
                (never stored plain text)
              </li>
              <li>
                <span className="text-slate-200">Curriculum board</span> → <code className="text-xs text-slate-400">board</code>{" "}
                (billing)
              </li>
              <li>
                <span className="text-slate-200">Role</span> → <code className="text-xs text-slate-400">role</code>
              </li>
              <li>
                <span className="text-slate-200">School tenant UUID</span> (optional) →{" "}
                <code className="text-xs text-slate-400">school_id</code>
              </li>
            </ul>
          </div>
        </div>

        <FormFrame
          eyebrow="Account"
          title="Sign-in credentials"
          description="Password login uses email + password (NextAuth credentials)."
        >
          <form onSubmit={(e) => void submit(e)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="displayName" className="block text-xs text-slate-500">
                Display name<span className="text-rose-400"> *</span>
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.displayName;
                      return n;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? "displayName-error" : undefined}
                className={`${demoControlClass} ${fieldErrors.displayName ? "border-rose-500 focus:border-rose-400" : ""}`}
              />
              {fieldErrors.displayName ? (
                <p id="displayName-error" className="mt-1 text-xs text-rose-400" role="alert">
                  {fieldErrors.displayName}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-slate-500">
                Email for password login <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.email;
                      return n;
                    });
                  }
                }}
                placeholder="you@school.edu"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`${demoControlClass} ${fieldErrors.email ? "border-rose-500 focus:border-rose-400" : ""}`}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1 text-xs text-rose-400" role="alert">
                  {fieldErrors.email}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-600">
                  If omitted, use synthetic address{" "}
                  <code className="text-slate-400">user-&lt;mobile&gt;@phone.aap.local</code> on the login page.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-xs text-slate-500">
                Mobile number (10 digits)<span className="text-rose-400"> *</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (fieldErrors.phoneNumber) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.phoneNumber;
                      return n;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.phoneNumber)}
                aria-describedby={fieldErrors.phoneNumber ? "phoneNumber-error" : undefined}
                className={`${demoControlClass} ${fieldErrors.phoneNumber ? "border-rose-500 focus:border-rose-400" : ""}`}
              />
              {fieldErrors.phoneNumber ? (
                <p id="phoneNumber-error" className="mt-1 text-xs text-rose-400" role="alert">
                  {fieldErrors.phoneNumber}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-slate-500">
                Password<span className="text-rose-400"> *</span> <span className="text-slate-600">(min 8)</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password || fieldErrors.confirmPassword) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.password;
                      delete n.confirmPassword;
                      return n;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={`${demoControlClass} ${fieldErrors.password ? "border-rose-500 focus:border-rose-400" : ""}`}
              />
              {fieldErrors.password ? (
                <p id="password-error" className="mt-1 text-xs text-rose-400" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs text-slate-500">
                Confirm password<span className="text-rose-400"> *</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((p) => {
                      const n = { ...p };
                      delete n.confirmPassword;
                      return n;
                    });
                  }
                }}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`${demoControlClass} ${fieldErrors.confirmPassword ? "border-rose-500 focus:border-rose-400" : ""}`}
              />
              {fieldErrors.confirmPassword ? (
                <p id="confirmPassword-error" className="mt-1 text-xs text-rose-400" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>

            <FormFrame
              eyebrow="Curriculum"
              title="Board & role"
              description="Stored on platform_users.board and used with role for billing."
              className="border-slate-700/80 bg-slate-900/40 p-5"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="board" className="block text-xs text-slate-500">
                    Curriculum board<span className="text-rose-400"> *</span>
                  </label>
                  <select
                    id="board"
                    value={boardSelect}
                    onChange={(e) => {
                      setBoardSelect(e.target.value);
                      if (fieldErrors.board) {
                        setFieldErrors((p) => {
                          const n = { ...p };
                          delete n.board;
                          return n;
                        });
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.board)}
                    aria-describedby={fieldErrors.board ? "board-error" : undefined}
                    className={`${demoControlClass} ${fieldErrors.board ? "border-rose-500 focus:border-rose-400" : ""}`}
                  >
                    {BILLING_BOARD_PRESETS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                    <option value="__custom__">Other — describe briefly</option>
                  </select>
                  {boardSelect === "__custom__" ? (
                    <input
                      type="text"
                      placeholder="Board name"
                      value={customBoard}
                      onChange={(e) => {
                        setCustomBoard(e.target.value);
                        if (fieldErrors.board) {
                          setFieldErrors((p) => {
                            const n = { ...p };
                            delete n.board;
                            return n;
                          });
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.board)}
                      className={`${demoControlClass} mt-2 ${fieldErrors.board ? "border-rose-500 focus:border-rose-400" : ""}`}
                    />
                  ) : null}
                  {fieldErrors.board ? (
                    <p id="board-error" className="mt-1 text-xs text-rose-400" role="alert">
                      {fieldErrors.board}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="role" className="block text-xs text-slate-500">
                    Role<span className="text-rose-400"> *</span>
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as PlatformRole)}
                    className={demoControlClass}
                  >
                    {SELECTABLE_PLATFORM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {PLATFORM_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FormFrame>

            <FormFrame
              eyebrow="School"
              title="Link to school tenant (optional)"
              description="Must match an existing row in schools.id when provided."
              className="border-slate-700/80 bg-slate-900/40 p-5"
            >
              <label htmlFor="schoolLinkMode" className="block text-xs text-slate-500">
                School link
              </label>
              <select
                id="schoolLinkMode"
                value={schoolLinkMode}
                onChange={(e) => setSchoolLinkMode(e.target.value as "none" | "id")}
                className={demoControlClass}
              >
                <option value="none">No — I will link later</option>
                <option value="id">Yes — I have a School tenant UUID</option>
              </select>
              {schoolLinkMode === "id" ? (
                <div className="mt-4">
                  <label htmlFor="schoolId" className="block text-xs text-slate-500">
                    School tenant UUID<span className="text-rose-400"> *</span>
                  </label>
                  <input
                    id="schoolId"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value);
                      if (fieldErrors.schoolId) {
                        setFieldErrors((p) => {
                          const n = { ...p };
                          delete n.schoolId;
                          return n;
                        });
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.schoolId)}
                    aria-describedby={fieldErrors.schoolId ? "schoolId-error" : undefined}
                    className={`${demoControlClass} font-mono text-xs ${fieldErrors.schoolId ? "border-rose-500 focus:border-rose-400" : ""}`}
                  />
                  {fieldErrors.schoolId ? (
                    <p id="schoolId-error" className="mt-1 text-xs text-rose-400" role="alert">
                      {fieldErrors.schoolId}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </FormFrame>

            <button
              type="submit"
              disabled={busy}
              className="min-h-[52px] w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
        </FormFrame>

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/login" className="text-cyan-400 underline">
            Already have an account
          </Link>
          <Link href="/pricing" className="text-cyan-400 underline">
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
