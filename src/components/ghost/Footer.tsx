export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            Idle Check is an independent research tool built for car buyers, not dealerships. We're not
            affiliated with Facebook, Craigslist, OfferUp, eBay, or any vehicle manufacturer — we just
            help you show up prepared.
          </p>
          <p>
            Everything in your report is based on historical repair data, known model-specific failure
            patterns, and AI analysis of the listing text you provided. It's a starting point, not a
            final verdict. Before you hand over any money, please have the car looked at by a certified
            ASE mechanic. A $100 pre-purchase inspection can save you thousands.
          </p>
          <p className="font-condensed text-xs uppercase tracking-wider text-foreground/70">
            Idle Check™ · Repair estimates are for informational purposes only.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
