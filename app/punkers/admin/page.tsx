import AdminPanel from './AdminPanel';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel | PUNKERS',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
