/** `jane@example.com` -> `j***@example.com`. For logs only; never log a full address. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}
