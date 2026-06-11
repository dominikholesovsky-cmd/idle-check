import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/ghost/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — Idle Check" }],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <p className="font-condensed text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-[14px] leading-relaxed text-foreground">

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              1. Who We Are
            </h2>
            <p>
              Idle Check ("we", "us", "our") is an independent vehicle research tool that helps
              used car buyers analyze listings before purchase. We are operated by Dominik Holešovský, reachable at dominik.holesovsky@gmail.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              2. What Information We Collect
            </h2>
            <p>
              We collect only what is necessary to provide the service:
            </p>
            <ul className="list-none space-y-2 pl-4">
              {[
                "Listing text you paste into the analyzer (sent to Anthropic's Claude API for analysis)",
                "Vehicle details you enter: make, model, year, mileage, VIN (VIN is sent to the NHTSA public API for recall lookups)",
                "Payment information when you purchase a full report (processed entirely by Stripe — we never see your card number)",
                "Basic usage data collected by Vercel (our hosting provider) such as IP address and request logs",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              3. What We Do Not Collect
            </h2>
            <ul className="list-none space-y-2 pl-4">
              {[
                "We do not require you to create an account",
                "We do not collect your name or email address",
                "We do not sell your data to third parties",
                "We do not use your data for advertising",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              4. Local Storage
            </h2>
            <p>
              Your report history is stored locally in your browser's localStorage. This data never
              leaves your device and is not accessible to us. You can delete it at any time by
              clearing your browser's site data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              5. Third-Party Services
            </h2>
            <ul className="list-none space-y-2 pl-4">
              {[
                "Anthropic — listing text is processed by Claude AI to generate inspection findings. Anthropic's privacy policy applies: anthropic.com/privacy",
                "NHTSA — VIN and vehicle details are sent to the US government's public recall database (api.nhtsa.gov). No account or API key required.",
                "Stripe — payment processing. Your card details go directly to Stripe and never touch our servers. Stripe's privacy policy: stripe.com/privacy",
                "Vercel — our hosting provider collects standard server logs including IP addresses. Vercel's privacy policy: vercel.com/legal/privacy-policy",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              6. California Residents (CCPA)
            </h2>
            <p>
              If you are a California resident, you have the right to know what personal information
              we collect, request deletion of your data, and opt out of any sale of personal
              information. We do not sell personal information. Because we do not collect names or
              email addresses, most CCPA rights can be fulfilled by clearing your browser's
              localStorage. For any other requests, contact us at dominik.holesovsky@gmail.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              7. Data Retention
            </h2>
            <p>
              We do not store reports on our servers. Vercel server logs are retained according to
              Vercel's standard policies (typically 30 days). Stripe retains payment records as
              required by financial regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              8. Children's Privacy
            </h2>
            <p>
              Idle Check is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. The "Last updated" date at the top of
              this page will reflect any changes. Continued use of the service after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              10. Contact
            </h2>
            <p>
              For privacy-related questions or requests, contact us at{" "}
              <a href="mailto:dominik.holesovsky@gmail.com" className="text-primary hover:underline">
                dominik.holesovsky@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}