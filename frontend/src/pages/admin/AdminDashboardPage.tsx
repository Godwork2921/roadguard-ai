import * as React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  Database,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Server,
  HardDrive,
  Brain,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PageContainer } from '@/components/layout/page-container';
import { AreaChart, LineChart, PieChart } from '@/components/ui/chart';
import { StatusDot } from '@/components/ui/status-dot';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn, formatRelativeTime } from '@/lib/utils';

interface SystemService {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  icon: React.ElementType;
  latency?: string;
  uptime?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  entity: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'login';
}

const services: SystemService[] = [
  { name: 'Database', status: 'healthy', icon: Database, latency: '2ms', uptime: '99.99%' },
  { name: 'Redis Cache', status: 'healthy', icon: HardDrive, latency: '1ms', uptime: '100%' },
  { name: 'AI Service', status: 'healthy', icon: Brain, latency: '45ms', uptime: '99.95%' },
  { name: 'API Gateway', status: 'healthy', icon: Server, latency: '8ms', uptime: '99.98%' },
];

const auditLogs: AuditEntry[] = [
  { id: '1', action: 'User registration', user: 'System', entity: 'User #1245', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'create' },
  { id: '2', action: 'Hazard verified', user: 'Officer Chen', entity: 'Hazard #892', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'update' },
  { id: '3', action: 'Trip completed', user: 'System', entity: 'Trip #4567', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'update' },
  { id: '4', action: 'User login', user: 'john@example.com', entity: 'Session', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'login' },
  { id: '5', action: 'Hazard reported', user: 'AI Detection', entity: 'Hazard #893', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'create' },
];

const userGrowthData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  drivers: Math.floor(Math.random() * 200) + 100,
  officers: Math.floor(Math.random() * 30) + 10,
  admins: Math.floor(Math.random() * 5) + 2,
}));

const roleData = [
  { name: 'Drivers', value: 2450 },
  { name: 'Passengers', value: 890 },
  { name: 'Authority', value: 45 },
  { name: 'Admins', value: 8 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Admin Dashboard"
      description="System overview and platform performance"
    >
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card glass>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                  <AnimatedCounter value={3393} className="text-2xl font-bold" />
                  <p className="text-xs text-emerald-500">+128 this week</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Today</p>
                  <AnimatedCounter value={847} className="text-2xl font-bold" />
                  <p className="text-xs text-emerald-500">+12% vs yesterday</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Trips</p>
                  <AnimatedCounter value={12589} className="text-2xl font-bold" />
                  <p className="text-xs text-emerald-500">+342 today</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sync Success</p>
                  <AnimatedCounter value={99.8} decimals={1} suffix="%" className="text-2xl font-bold" />
                  <p className="text-xs text-emerald-500">99.9% target</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card glass className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
              <CardDescription>All services operational</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map((svc, idx) => {
                const Icon = svc.icon;
                const statusColor = svc.status === 'healthy' ? 'text-emerald-500' : svc.status === 'degraded' ? 'text-amber-500' : 'text-red-500';
                const statusBg = svc.status === 'healthy' ? 'bg-emerald-500/10' : svc.status === 'degraded' ? 'bg-amber-500/10' : 'bg-red-500/10';
                return (
                  <motion.div
                    key={svc.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', statusBg, statusColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">Latency: {svc.latency} · Uptime: {svc.uptime}</p>
                      </div>
                    </div>
                    <StatusDot status={svc.status === 'healthy' ? 'active' : svc.status === 'degraded' ? 'warning' : 'danger'} />
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Users by Role</CardTitle>
              <CardDescription>Platform user distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={roleData}
                height={240}
                innerRadius={50}
                outerRadius={90}
              />
              <div className="mt-4 space-y-2">
                {roleData.map((role) => (
                  <div key={role.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{role.name}</span>
                    <span className="font-medium">{role.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">User Growth</CardTitle>
              <CardDescription>Monthly user registrations by role</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={userGrowthData}
                categories={['drivers', 'officers']}
                index="month"
                height={250}
                colors={['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)']}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Audit Log</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/admin/audit-logs')}>
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditLogs.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      entry.type === 'create' ? 'bg-emerald-500/10 text-emerald-500' :
                      entry.type === 'delete' ? 'bg-red-500/10 text-red-500' :
                      'bg-primary/10 text-primary'
                    )}>
                      {entry.type === 'create' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                       entry.type === 'delete' ? <XCircle className="h-3.5 w-3.5" /> :
                       <Activity className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.user} · {entry.entity}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(entry.timestamp)}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card glass>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Response Time</p>
                <p className="text-2xl font-bold">124ms</p>
                <Progress value={62} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">62% of 200ms threshold</p>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Error Rate</p>
                <p className="text-2xl font-bold">0.12%</p>
                <Progress value={12} variant="risk" className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Below 1% target</p>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPU Usage</p>
                <p className="text-2xl font-bold">34%</p>
                <Progress value={34} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Across all nodes</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
