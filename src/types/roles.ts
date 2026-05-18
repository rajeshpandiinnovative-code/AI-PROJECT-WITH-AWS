/**
 * AI Academy Pro - Master Role Hierarchy
 * L0 through L7 as defined for the SaaS structure.
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',     // L0: Pinnacle Software Solution (You)
  MANAGEMENT = 'MANAGEMENT',       // L1: School Correspondent / Owner
  PRINCIPAL = 'PRINCIPAL',         // L2: Academic Head
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',   // L3: IT/Office Administrator
  TEACHER = 'TEACHER',             // L4: Classroom Instructor
  PARENT = 'PARENT',               // L5: Student Guardian
  STUDENT = 'STUDENT',             // L6: The Learner
  GUEST = 'GUEST'                  // L7: Unauthenticated / Visitor
}

export type RoleAccess = keyof typeof UserRole;