import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { Resend } from "resend";
import type { AnalysisState } from "@/routes/index";

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#b22222",
  MED: "#d97706",
  LOW: "#16a34a",
};

const VERDICT_COLOR: Record<string, string> = {
  buy: "#16a34a",
  negotiate: "#d97706",
  walk: "#b22222",
};

function buildHtml(report: AnalysisState, shareUrl: string | null): string {
  const vehicle = `${report.vehicle.year ?? ""} ${report.vehicle.make} ${report.vehicle.model}`.trim();
  const price = `$${report.askingPrice.toLocaleString()}`;
  const verdict = report.recommendation?.verdict ?? "negotiate";
  const verdictColor = VERDICT_COLOR[verdict] ?? "#111";
  const issuesHtml = report.issues
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111">${i.label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center">
          <span style="background:${SEVERITY_COLOR[i.severity] ?? "#6b7280"};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${i.severity}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111;text-align:right;font-family:monospace">
          $${i.costMin.toLocaleString()} – $${i.costMax.toLocaleString()}
        </td>
      </tr>`
    )
    .join("");

  const redFlagsHtml =
    report.sellerRedFlags && report.sellerRedFlags.length > 0
      ? `<div style="margin-top:28px">
          <h2 style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#b22222;margin:0 0 10px">Seller Red Flags</h2>
          <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.7">
            ${report.sellerRedFlags.map((f) => `<li>${f}</li>`).join("")}
          </ul>
        </div>`
      : "";

  const marketHtml = report.marketValueNote
    ? `<div style="margin-top:20px;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-size:13px;color:#374151">
        <strong style="color:#111">Market Value:</strong> ${report.marketValueNote}
      </div>`
    : "";

  const recallsHtml =
    report.recalls && report.recalls.length > 0
      ? `<div style="margin-top:28px">
          <h2 style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#b22222;margin:0 0 10px">NHTSA Recalls (${report.recalls.length})</h2>
          ${report.recalls
            .map(
              (r) =>
                `<div style="margin-bottom:10px;padding:10px 14px;border:1px solid #e5e7eb;border-radius:6px">
                  <div style="font-size:13px;font-weight:600;color:#111">${r.component}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:3px">${r.description ?? ""}</div>
                </div>`
            )
            .join("")}
        </div>`
      : "";

  const shareCta = shareUrl
    ? `<div style="margin-top:32px;text-align:center">
        <a href="${shareUrl}" style="display:inline-block;background:#b22222;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;letter-spacing:.04em">
          View Full Interactive Report →
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">

    <!-- Header -->
    <div style="background:#111;padding:24px 32px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#b22222">Idle Check</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-top:4px">${vehicle}</div>
      <div style="font-size:13px;color:#9ca3af;margin-top:4px">Asking price: ${price} · ${report.marketplace}</div>
    </div>

    <div style="padding:28px 32px">

      <!-- Verdict -->
      <div style="border:2px solid ${verdictColor};border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${verdictColor}">Verdict · ${verdict.toUpperCase()}</div>
        <div style="font-size:17px;font-weight:700;color:#111;margin-top:6px">${report.recommendation?.headline ?? ""}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:6px;line-height:1.6">${report.recommendation?.summary ?? ""}</div>
      </div>

      <!-- Issues -->
      ${
        report.issues.length > 0
          ? `<h2 style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#b22222;margin:0 0 10px">Detected Issues</h2>
             <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
               <thead>
                 <tr style="background:#b22222">
                   <th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase">Issue</th>
                   <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase">Severity</th>
                   <th style="padding:9px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase">Est. Cost</th>
                 </tr>
               </thead>
               <tbody>${issuesHtml}</tbody>
             </table>`
          : ""
      }

      ${redFlagsHtml}
      ${marketHtml}
      ${recallsHtml}
      ${shareCta}

      <!-- Footer -->
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
        Generated by Idle Check · idle-check.com<br>
        For informational purposes only. Always get a professional inspection.
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const sendReportEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      reportJson: z.record(z.unknown()),
      shareId: z.string().nullable().optional(),
    })
  )
  .handler(async ({ data }) => {
    if (!process.env.RESEND_API_KEY || !process.env.STRIPE_SECRET_KEY) return;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    const email = session.customer_details?.email;
    if (!email) return;

    const report = data.reportJson as unknown as AnalysisState;
    const shareUrl = data.shareId ? `https://idle-check.com/report/${data.shareId}` : null;
    const vehicle = `${report.vehicle?.year ?? ""} ${report.vehicle?.make} ${report.vehicle?.model}`.trim();

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Idle Check <noreply@idle-check.com>",
      to: email,
      subject: `Your Idle Check report — ${vehicle}`,
      html: buildHtml(report, shareUrl),
    });

    console.log("Report email sent to", email, "for", vehicle);
  });
