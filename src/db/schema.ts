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
 * Pilot directory (global_schools): master list of schools (e.g. Srivilliputhur / Virudhunagar).
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
  district: varchar("district", { length: 128 }).notNull().default("Virudhunagar"),
  board: varchar("board", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

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
