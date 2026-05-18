import { pgEnum, pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";

// 1. Roles & Enums
export const roleEnum = pgEnum("user_role", [
  "SUPER_ADMIN", "MANAGEMENT", "PRINCIPAL", "SCHOOL_ADMIN", 
  "TEACHER", "PARENT", "STUDENT", "GUEST",
]);

// 2. Multi-Tenant Schools
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Unified Users
export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").default("GUEST").notNull(),
  schoolId: uuid("school_id").references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Curriculum Modules (Courses)
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").references(() => schools.id),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Lessons (Content & Virtual Teacher Support)
export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").references(() => modules.id),
  title: text("title").notNull(),
  content: text("content"), // Support for Markdown/HTML
  videoUrl: text("video_url"),
  order: integer("order").default(0),
  aiPromptContext: text("ai_prompt_context"), // Context for the Virtual Teacher
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Analytics (System Events)
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  userId: uuid("user_id").references(() => users.id),
  payload: jsonb("payload").default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});