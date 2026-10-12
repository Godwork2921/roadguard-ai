import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/app-shell';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const DriverDashboardPage = lazy(() => import('@/pages/driver/DriverDashboardPage'));
const AuthorityDashboardPage = lazy(() => import('@/pages/authority/AuthorityDashboardPage'));
const TripsPage = lazy(() => import('@/pages/trips/TripsPage'));
const TripDetailPage = lazy(() => import('@/pages/trips/TripDetailPage'));
const TripsActivePage = lazy(() => import('@/pages/trips/TripsActivePage'));
const HazardsPage = lazy(() => import('@/pages/hazards/HazardsPage'));
const HazardDetailPage = lazy(() => import('@/pages/hazards/HazardDetailPage'));
const ReportHazardPage = lazy(() => import('@/pages/hazards/ReportHazardPage'));
const MapPage = lazy(() => import('@/pages/map/MapPage'));
const RouteAnalysisPage = lazy(() => import('@/pages/routes/RouteAnalysisPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin-slow rounded-full border-4 border-primary/30 border-t-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function RoleRoute({ roles }: { roles: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/active" element={<TripsActivePage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/hazards" element={<HazardsPage />} />
            <Route path="/hazards/new" element={<ReportHazardPage />} />
            <Route path="/hazards/:id" element={<HazardDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/routes" element={<RouteAnalysisPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />

            <Route element={<RoleRoute roles={['DRIVER']} />}>
              <Route path="/driver" element={<DriverDashboardPage />} />
            </Route>

            <Route element={<RoleRoute roles={['AUTHORITY_OFFICER']} />}>
              <Route path="/authority" element={<AuthorityDashboardPage />} />
            </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
