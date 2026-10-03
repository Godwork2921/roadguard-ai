import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Route,
  Navigation,
  BarChart3,
  Bell,
  Settings,
  Shield,
  ChevronLeft,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  children?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Live Map', icon: Map, path: '/map' },
  {
    label: 'Hazards',
    icon: AlertTriangle,
    path: '/hazards',
    badge: 12,
    children: [
      { label: 'All Hazards', path: '/hazards' },
      { label: 'Report Hazard', path: '/hazards/report' },
    ],
  },
  { label: 'Trips', icon: Navigation, path: '/trips' },
  { label: 'Route Analysis', icon: Route, path: '/routes' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Notifications', icon: Bell, path: '/notifications', badge: 5 },
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Admin', icon: Shield, path: '/admin', children: [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Audit Log', path: '/admin/audit' },
    { label: 'Configuration', path: '/admin/config' },
  ]},
];

function Sidebar({ collapsed, onToggle, isMobile, open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = React.useState<Set<string>>(new Set(['Admin']));

  const filteredMenuItems = React.useMemo(
    () => (user?.role === 'DRIVER' ? menuItems.filter((m) => m.label !== 'Dashboard') : menuItems),
    [user?.role]
  );

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div
      className={cn(
        'flex h-full flex-col bg-background/80 backdrop-blur-xl border-r border-border/50',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
              <Shield className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">RoadGuard AI</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25 mx-auto">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const expanded = expandedMenus.has(item.label);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => !collapsed && toggleSubmenu(item.label)}
                  className={cn(
                    'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative shrink-0">
                    <Icon className="h-5 w-5" />
                    {item.badge && !collapsed && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-bold text-destructive">
                          {item.badge}
                        </span>
                      )}
                      <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </motion.div>
                    </>
                  )}
                  {active && !collapsed && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="relative shrink-0">
                    <Icon className="h-5 w-5" />
                    {item.badge && collapsed && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-bold text-destructive">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {active && !collapsed && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </NavLink>
              )}

              {hasChildren && !collapsed && (
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-8 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children!.map((child) => {
                          const childActive = location.pathname === child.path;
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={isMobile ? onClose : undefined}
                              className={cn(
                                'block rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                childActive
                                  ? 'text-primary bg-primary/5'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              )}
                            >
                              {child.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8 ring-2 ring-border">
            <AvatarImage src="" />
            <AvatarFallback>{user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Driver'}</p>
            </motion.div>
          )}
          {!collapsed && (
            <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px]"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-30 hidden lg:block"
    >
      {sidebarContent}
    </motion.aside>
  );
}

export { Sidebar };
