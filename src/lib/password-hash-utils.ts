/** True when `password_hash` is a normal bcrypt string (not a placeholder for OAuth-only rows). */
export function passwordHashSupportsBcryptVerify(hash: string | null | undefined): boolean {
  if (!hash || typeof hash !== "string") return false;
  return /^\$2[aby]\$\d{2}\$.+/.test(hash.trim());
}
