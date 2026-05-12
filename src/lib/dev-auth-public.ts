/**
 * Client-readable hints for dev-only auth (master OTP must match server `DEV_MASTER_OTP`, default `123456`).
 * Used only from DevSwitcher / Demo panel in development builds.
 */
export const DEV_MASTER_OTP_CLIENT = "123456";

/** After `npm run seed:local-pilot` — matches `pilot-owner-a@local.test` (MANAGEMENT, School A). */
export const PILOT_SEED_PHONE_SCHOOL_A_MANAGEMENT = "9876500001";
