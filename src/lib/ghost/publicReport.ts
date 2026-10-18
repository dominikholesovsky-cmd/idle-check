// The report JSON is stored in the `reports` table, which anyone with the public anon key can read
// (it backs /report/:id). It must therefore never contain personal data. Strip the owner's email and
// marketing consent before an AnalysisState is turned into report_json, and only record the fact
// that the report is saved under an email.
export function toPublicReportJson<T extends { email?: string; marketingOptIn?: boolean }>(
  state: T,
): Omit<T, "email" | "marketingOptIn"> & { savedToEmail?: true } {
  const { email, marketingOptIn: _marketingOptIn, ...rest } = state;
  return email ? { ...rest, savedToEmail: true } : rest;
}
