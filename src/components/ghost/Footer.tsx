export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <span>|</span>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
        <div className="mx-auto mt-6 max-w-3xl space-y-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          <p>
            Ghost Inspector is an independent data provider and is not affiliated, associated, authorized,
            endorsed by, or in any way officially connected with Meta, Facebook, Craigslist, OfferUp, eBay,
            or any vehicle manufacturer. All product and company names are trademarks™ of their respective holders.
          </p>
          <p>
            All generated reports, technical inspection points, and repair estimates are based on simulated
            historical data for informational purposes only. We do not guarantee the mechanical condition or
            safety of any vehicle. Always consult with a certified ASE mechanic before purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}
