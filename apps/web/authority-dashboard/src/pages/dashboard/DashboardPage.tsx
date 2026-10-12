import { useAuth } from '@/hooks/useAuth';
import DriverDashboardPage from '@/pages/driver/DriverDashboardPage';
import AuthorityDashboardPage from '@/pages/authority/AuthorityDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'AUTHORITY_OFFICER':
      return <AuthorityDashboardPage />;
    case 'DRIVER':
    case 'PASSENGER':
    default:
      return <DriverDashboardPage />;
  }
}
