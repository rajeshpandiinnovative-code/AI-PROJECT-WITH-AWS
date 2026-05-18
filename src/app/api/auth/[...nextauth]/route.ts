// From: src/app/api/auth/[...nextauth]/route.ts
// To:   src/lib/auth.ts
import { handlers } from "../../../../lib/auth";

export const { GET, POST } = handlers;