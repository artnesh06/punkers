/**
 * Admin panel uses a bare layout — no Navbar, Footer, or Aurora background.
 */
export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}
