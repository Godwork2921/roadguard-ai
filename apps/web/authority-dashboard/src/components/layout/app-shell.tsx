import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Breadcrumb {
  label: string;
  href?: string;
}

const routeBreadcrumbs: Record<string, Breadcrumb[]> = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/map': [{ label: 'Live Map' }],
  '/hazards': [{ label: 'Hazards', href: '/hazards' }, { label: 'All Hazards' }],
  '/hazards/report': [{ label: 'Hazards', href: '/hazards' }, { label: 'Report Hazard' }],
  '/trips': [{ label: 'Trips' }],
  '/routes': [{ label: 'Route Analysis' }],
  '/analytics': [{ label: 'Analytics' }],
  '/notifications': [{ label: 'Notifications' }],
  '/settings': [{ label: 'Settings' }],
  '/profile': [{ label: 'Profile' }],
};

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();

  React.useEffect(() => {
    if (isMobile) setMobileSidebarOpen(false);
  }, [location.pathname, isMobile]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbs = (): Breadcrumb[] => {
    const path = location.pathname;
    if (routeBreadcrumbs[path]) return routeBreadcrumbs[path];

    const matched = Object.entries(routeBreadcrumbs).find(([key]) =>
      path.startsWith(key)
    );
    return matched ? matched[1] : [];
  };

  return (
    <div className="app-shell-bg relative min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isMobile ? 'lg:ml-[68px]' : sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        )}
      >
        <Navbar
          onMenuToggle={() => setMobileSidebarOpen(true)}
          breadcrumbs={getBreadcrumbs()}
        />

        <main>
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
