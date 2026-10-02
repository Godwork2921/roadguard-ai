import * as React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Timer,
  Download,
  Calendar,
  BarChart3,
  Activity,
  Route,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PageContainer } from '@/components/layout/page-container';
import { AreaChart, LineChart, BarChart, PieChart } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const dAUData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  users: Math.floor(Math.random() * 200) + 400,
  newUsers: Math.floor(Math.random() * 40) + 20,
}));

const tripTrendData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  trips: Math.floor(Math.random() * 500) + 300,
  completed: Math.floor(Math.random() * 400) + 250,
}));

const hazardByTypeData = [
  { name: 'Pothole', value: 342 },
  { name: 'Flooding', value: 128 },
  { name: 'Road Blockage', value: 95 },
  { name: 'Accident', value: 73 },
  { name: 'Construction', value: 156 },
  { name: 'Debris', value: 67 },
];

const hazardBySeverityData = [
  { name: 'Low', value: 215 },
  { name: 'Medium', value: 342 },
  { name: 'High', value: 178 },
  { name: 'Critical', value: 56 },
];

const responseTimeData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  responseTime: Math.floor(Math.random() * 120) + 30,
  target: 60,
}));

const dangerousRoadsData = [
  { name: 'Broadway', value: 45 },
  { name: '5th Avenue', value: 38 },
  { name: 'Highway 101', value: 32 },
  { name: 'Oak Street', value: 28 },
  { name: 'River Road', value: 24 },
  { name: 'Park Avenue', value: 19 },
  { name: 'Madison Ave', value: 15 },
  { name: 'Church Street', value: 12 },
];

const kpis = [
  { label: 'Daily Active Users', value: 847, icon: Users, color: 'text-blue-500 bg-blue-500/10', trend: '+12%' },
  { label: 'Total Trips', value: 12589, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10', trend: '+8%' },
  { label: 'Hazards Reported', value: 891, icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10', trend: '+23%' },
  { label: 'Avg Response Time', value: 4.2, suffix: 'h', icon: Timer, color: 'text-primary bg-primary/10', trend: '-18%' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = React.useState('30d');

  return (
    <PageContainer
      title="Analytics"
      description="Platform metrics and insights"
      actions={
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Custom Range
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download Report
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
                      <span className={cn(
                        'text-xs font-medium',
                        kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {kpi.trend}
                      </span>
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

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Daily Active Users</CardTitle>
              <CardDescription>User activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={dAUData}
                categories={['users', 'newUsers']}
                index="date"
                height={280}
                colors={['hsl(262, 83%, 58%)', 'hsl(187, 85%, 39%)']}
                valueFormatter={(v) => `${v} users`}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Trip Trends</CardTitle>
              <CardDescription>Monthly trip volume</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={tripTrendData}
                categories={['trips', 'completed']}
                index="month"
                height={280}
                valueFormatter={(v) => `${v} trips`}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Hazards by Type</CardTitle>
              <CardDescription>Distribution across hazard types</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={hazardByTypeData.map((d) => ({ ...d, count: d.value }))}
                categories={['count']}
                index="name"
                height={280}
                colors={['hsl(38, 92%, 50%)']}
                valueFormatter={(v) => `${v} hazards`}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Hazards by Severity</CardTitle>
              <CardDescription>Severity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={hazardBySeverityData}
                height={280}
                innerRadius={60}
                outerRadius={100}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Top Dangerous Roads</CardTitle>
              <CardDescription>Roads with most hazards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dangerousRoadsData.map((road, idx) => (
                <motion.div
                  key={road.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-5 text-xs font-bold',
                        idx === 0 ? 'text-red-500' : idx === 1 ? 'text-orange-500' : idx === 2 ? 'text-amber-500' : 'text-muted-foreground'
                      )}>
                        {idx + 1}
                      </span>
                      <span>{road.name}</span>
                    </div>
                    <span className="font-medium">{road.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-amber-500' : 'bg-muted-foreground/30'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${(road.value / dangerousRoadsData[0].value) * 100}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08 }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Response Time Trend</CardTitle>
              <CardDescription>Average time to resolve hazards</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={responseTimeData}
                categories={['responseTime', 'target']}
                index="month"
                height={280}
                colors={['hsl(0, 84%, 60%)', 'hsl(142, 76%, 36%)']}
                valueFormatter={(v) => `${v} min`}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
