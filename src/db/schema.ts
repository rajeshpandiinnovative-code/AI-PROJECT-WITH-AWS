import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * National directory (`global_schools`): UDISE+ sourced rows for onboarding search / claim.
 * Primary key on udise_code uses PostgreSQL’s default B-tree unique index.
 */
export const globalSchools = pgTable(
  "global_schools",
  {
    udiseCode: varchar("udise_code", { length: 11 }).primaryKey(),
    schoolName: text("school_name").notNull(),
    schoolEmail: varchar("school_email", { length: 255 }),
    mobileNumber: varchar("mobile_number", { length: 15 }),
    principalName: text("principal_name"),
    stateName: varchar("state_name", { length: 100 }),
    districtName: varchar("district_name", { length: 100 }),
    blockName: varchar("block_name", { length: 100 }),
    pincode: varchar("pincode", { length: 6 }),
    management: varchar("management", { length: 100 }),
    category: varchar("category", { length: 100 }),
    /** Filter in UI: e.g. CBSE, ICSE, TN-MATRIC */
    boardName: text("board_name"),
  },
  (table) => ({
    schoolNameGinIdx: index("global_schools_school_name_gin_idx").using(
      "gin",
      sql`${table.schoolName} gin_trgm_ops`,
    ),
    boardNameIdx: index("global_schools_board_name_idx").on(table.boardName),
  }),
);

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  udiseCode: varchar("udise_code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  district: varchar("district", { length: 128 }).notNull().default("India"),
  board: varchar("board", { length: 128 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  /** Internal trial: `trial`. Paid via Stripe: `trialing` | `active` | `past_due` | `canceled` | `unpaid` | `none`. */
  subscriptionStatus: varchar("subscription_status", { length: 32 }).notNull().default("trial"),
  subscriptionTrialEndsAt: timestamp("subscription_trial_ends_at", { withTimezone: true }),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Individual accounts (student, parent, teacher, etc.) with their own Stripe subscription. */
export const platformUsers = pgTable(
  "platform_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull().default(""),
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
    /** Curriculum board for Stripe Price resolution (with role). */
    board: varchar("board", { length: 128 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    subscriptionStatus: varchar("subscription_status", { length: 32 }).notNull().default("trial"),
    subscriptionTrialEndsAt: timestamp("subscription_trial_ends_at", { withTimezone: true }),
    subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("platform_users_school_id_idx").on(table.schoolId),
    roleIdx: index("platform_users_role_idx").on(table.role),
  }),
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    rollNo: varchar("roll_no", { length: 64 }).notNull(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("students_school_id_idx").on(table.schoolId),
  }),
);

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    date: date("date").notNull(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("exams_school_id_idx").on(table.schoolId),
  }),
);

export const results = pgTable(
  "results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    marks: integer("marks").notNull(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("results_school_id_idx").on(table.schoolId),
  }),
);

export const moduleHistories = pgTable(
  "module_histories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: text("school_id").notNull(),
    moduleSlug: varchar("module_slug", { length: 128 }).notNull(),
    moduleTitle: varchar("module_title", { length: 255 }).notNull(),
    inputData: jsonb("input_data").notNull(),
    outputData: jsonb("output_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("module_histories_school_id_idx").on(table.schoolId),
    moduleSlugIdx: index("module_histories_module_slug_idx").on(table.moduleSlug),
  }),
);

export const interventionTasks = pgTable(
  "intervention_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: text("school_id").notNull(),
    sourceResultId: uuid("source_result_id"),
    studentName: varchar("student_name", { length: 255 }).notNull(),
    examName: varchar("exam_name", { length: 255 }).notNull(),
    marks: integer("marks").notNull(),
    recommendedModule: varchar("recommended_module", { length: 128 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("assigned"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("intervention_tasks_school_id_idx").on(table.schoolId),
    statusIdx: index("intervention_tasks_status_idx").on(table.status),
  }),
);

export const interventionAuditLogs = pgTable(
  "intervention_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: text("school_id").notNull(),
    actionType: varchar("action_type", { length: 64 }).notNull(),
    affectedCount: integer("affected_count").notNull().default(0),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("intervention_audit_logs_school_id_idx").on(table.schoolId),
    actionTypeIdx: index("intervention_audit_logs_action_type_idx").on(table.actionType),
  }),
);

export const interventionDailyDigests = pgTable(
  "intervention_daily_digests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: text("school_id").notNull(),
    digestDate: date("digest_date").notNull(),
    summary: jsonb("summary").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    schoolIdIdx: index("intervention_daily_digests_school_id_idx").on(table.schoolId),
    digestDateIdx: index("intervention_daily_digests_digest_date_idx").on(table.digestDate),
  }),
);

/** Page views, auth funnel, and other product telemetry (operational). */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    typeCreatedIdx: index("analytics_events_type_created_idx").on(table.eventType, table.createdAt),
  }),
);

/** Demo / marketing captures from landing page (name + mobile). */
export const demoLeads = pgTable(
  "demo_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    mobile: varchar("mobile", { length: 32 }).notNull(),
    referrer: text("referrer"),
    path: varchar("path", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdIdx: index("demo_leads_created_idx").on(table.createdAt),
  }),
);
