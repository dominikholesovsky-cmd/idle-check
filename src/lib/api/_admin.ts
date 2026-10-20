// Server-only. The single admin allowlist check, used by getAccountInfo and assertPaidOrAdmin.
// ADMIN_EMAILS is read at call time (never at module load), split on commas, semicolons and any whitespace or
// newlines, stripped of surrounding quotes, and compared lowercased. Missing or empty means nobody is admin.

export function adminAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(/[,;\s]+/)
    .map((entry) => entry.trim().replace(/^["'`]+|["'`]+$/g, "").trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const wanted = (email ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").toLowerCase();
  if (!wanted) return false;
  return adminAllowlist().includes(wanted);
}

/** d***@gmail.com. For logs only. */
export function maskEmailForLog(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
