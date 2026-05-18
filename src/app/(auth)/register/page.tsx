import { redirect } from "next/navigation";

import { showDemoEntrypoints } from "@/src/lib/show-demo";

/** Bookmarks `/register` → demo when enabled, else paid signup (same URL as header Register when demo is off). */
export default function RegisterPage() {
  redirect(showDemoEntrypoints() ? "/login?mode=demo" : "/register/account");
}
