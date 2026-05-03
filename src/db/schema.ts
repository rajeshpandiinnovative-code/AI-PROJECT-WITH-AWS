import {
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
