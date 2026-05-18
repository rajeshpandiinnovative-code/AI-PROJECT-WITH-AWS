// ... inside your authorize(credentials) function ...

// Now that src/db/index.ts exists, this line will work!
const { db } = await import("../db");
const { users } = await import("../db/schema");

const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);