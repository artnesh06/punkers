import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile | Punkers',
  description: 'View your Punkers collection, certificates, and stats.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
