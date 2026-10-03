import * as React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Timer,
  Map,
  Filter,
  ChevronRight,
  Shield,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PageContainer } from '@/components/layout/page-container';
import { AreaChart } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/ui/status-dot';
import { Separator } from '@/components/ui/separator';
import { cn, formatRelativeTime } from '@/lib/utils';

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend: number;
  trendLabel: string;
}

interface PendingHazard {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  reportedBy: string;
  time: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface MaintenanceTask {
  id: string;
  title: string;
  status: 'IN_PROGRESS' | 'PENDING' | 'COMPLETED';
  assignedTo: string;
  dueDate: string;
}

const kpis: KPI[] = [
  { label: 'Active Hazards', value: 24, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10', trend: 12, trendLabel: 'vs last week' },
  { label: 'Pending Verification', value: 8, icon: Clock, color: 'text-amber-500 bg-amber-500/10', trend: -3, trendLabel: 'vs last week' },
  { label: 'Unresolved Issues', value: 15, icon: Timer, color: 'text-orange-500 bg-orange-500/10', trend: 5, trendLabel: 'vs last week' },
  { label: 'Avg Response Time', value: 4.2, icon: Shield, color: 'text-emerald-500 bg-emerald-500/10', trend: -18, trendLabel: 'improvement', suffix: 'h' },
];

const pendingHazards: PendingHazard[] = [
  { id: '1', type: 'Pothole', severity: 'CRITICAL', location: 'Highway 101, Mile 23', reportedBy: 'AI Detection', time: new Date(Date.now() - 600000).toISOString(), priority: 'URGENT' },
  { id: '2', type: 'Flooding', severity: 'HIGH', location: 'River Road & Oak Ave', reportedBy: 'John D.', time: new Date(Date.now() - 1800000).toISOString(), priority: 'HIGH' },
  { id: '3', type: 'Road Blockage', severity: 'HIGH', location: 'Main St & 5th Ave', reportedBy: 'Sarah M.', time: new Date(Date.now() - 3600000).toISOString(), priority: 'HIGH' },
  { id: '4', type: 'Accident', severity: 'CRITICAL', location: 'I-95 Northbound Exit 12', reportedBy: 'Emergency Dispatch', time: new Date(Date.now() - 7200000).toISOString(), priority: 'URGENT' },
];

const maintenanceTasks: MaintenanceTask[] = [
  { id: '1', title: 'Pothole repair - Oak Ave', status: 'IN_PROGRESS', assignedTo: 'Crew A', dueDate: '2026-07-16' },
  { id: '2', title: 'Road sign replacement', status: 'PENDING', assignedTo: 'Crew B', dueDate: '2026-07-18' },
  { id: '3', title: 'Flood drainage cleanup', status: 'COMPLETED', assignedTo: 'Crew C', dueDate: '2026-07-14' },
];

const hazardTrendData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
  hazards: Math.floor(Math.random() * 15) + 3,
  verified: Math.floor(Math.random() * 10) + 1,
}));

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AuthorityDashboardPage() {
  const navigate = useNavigate();

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <PageContainer
      title="Authority Dashboard"
      description="Monitor and manage road hazards in your jurisdiction"
      actions={
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="suburbs">Suburbs</SelectItem>
              <SelectItem value="highway">Highways</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      }
    >
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} glass>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter value={kpi.value} className="text-2xl font-bold" suffix={kpi.suffix || ''} decimals={kpi.suffix ? 1 : 0} />
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        kpi.trend > 0 ? 'text-red-500' : 'text-emerald-500'
                      )}>
                        <span>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</span>
                        <span className="text-muted-foreground font-normal">{kpi.trendLabel}</span>
                      </div>
                    </div>
                    <div className={cn('p-2.5 rounded-xl', kpi.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card glass className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Hazard Trend (Last 7 Days)</CardTitle>
                  <CardDescription>Reported vs verified hazards</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={hazardTrendData}
                categories={['hazards', 'verified']}
                index="date"
                height={250}
                colors={['hsl(0, 84%, 60%)', 'hsl(142, 76%, 36%)']}
                valueFormatter={(v) => `${v} hazards`}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Map Preview</CardTitle>
                  <CardDescription>Active hazards in area</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-[200px] rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(239,68,68,0.15)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(234,179,8,0.1)_0%,transparent_50%)]" />
                <div className="absolute bottom-3 left-3 right-3 space-y-2">
                  {[
                    { label: 'Critical', count: 3, color: 'text-red-500' },
                    { label: 'High', count: 7, color: 'text-orange-500' },
                    { label: 'Medium', count: 14, color: 'text-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className={cn('font-medium', item.color)}>{item.label}</span>
                      <span className="text-muted-foreground">{item.count} hazards</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pending Verification</CardTitle>
                  <CardDescription>Hazards requiring your attention</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/hazards')}>
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingHazards.map((hazard, idx) => (
                <motion.div
                  key={hazard.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/hazards/${hazard.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg',
                      hazard.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                      hazard.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-amber-500/10 text-amber-500'
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{hazard.type}</p>
                      <p className="text-xs text-muted-foreground">{hazard.location}</p>
                      <p className="text-xs text-muted-foreground">Reported by {hazard.reportedBy} · {formatRelativeTime(hazard.time)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    getPriorityColor(hazard.priority)
                  )}>
                    {hazard.priority}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Maintenance Tasks</CardTitle>
                  <CardDescription>Ongoing road repairs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {maintenanceTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg',
                      task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                      task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-muted-foreground/10 text-muted-foreground'
                    )}>
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Assigned to {task.assignedTo}</p>
                    </div>
                  </div>
                  <Badge
                    variant={task.status === 'COMPLETED' ? 'low' : task.status === 'IN_PROGRESS' ? 'medium' : 'secondary'}
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
