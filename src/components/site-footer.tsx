// Shared storefront footer: hairline rule, tracked column labels, and four
// responsive columns. Rendered on every customer-facing page.
export function SiteFooter() {
  return (
    <footer className="container-luxe section">
      <hr className="hairline mb-10" />
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="overline">Client Care</p>
          <a href="#" className="link text-caption">Contact us</a>
          <a href="#" className="link text-caption">Shipping &amp; returns</a>
          <a href="#" className="link text-caption">Order tracking</a>
        </div>
        <div className="flex flex-col gap-3">
          <p className="overline">The Company</p>
          <a href="#" className="link text-caption">About Clover</a>
          <a href="#" className="link text-caption">Sustainability</a>
          <a href="#" className="link text-caption">Careers</a>
        </div>
        <div className="flex flex-col gap-3">
          <p className="overline">Legal</p>
          <a href="#" className="link text-caption">Privacy policy</a>
          <a href="#" className="link text-caption">Terms of service</a>
        </div>
        <div className="flex flex-col gap-3">
          <p className="overline">Follow</p>
          <a href="#" className="link text-caption">Instagram</a>
          <a href="#" className="link text-caption">Pinterest</a>
        </div>
      </div>
      <p className="text-caption text-muted mt-12">© 2026 Clover Store. Sample data and imagery for demonstration; all content original.</p>
    </footer>
  );
}
