import * as React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Map,
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  Play,
  Route,
  ChevronRight,
  Gauge,
  Car,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { PageContainer } from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { StatusDot } from '@/components/ui/status-dot';
import { formatRelativeTime, cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

interface Trip {
  id: string;
  startAddress: string;
  endAddress: string;
  startTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  riskScore: number;
  distance: string;
}

interface HazardAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  distance: string;
  time: string;
}

const stats: Stat[] = [
  { label: 'Active Trips', value: 2, icon: Navigation, color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Total Trips', value: 47, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Hazards Reported', value: 12, icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Safe Routes', value: 38, suffix: '/47', icon: Shield, color: 'text-primary bg-primary/10' },
];

const recentTrips: Trip[] = [
  { id: '1', startAddress: 'Downtown Hub', endAddress: 'Airport Terminal 2', startTime: new Date(Date.now() - 3600000).toISOString(), status: 'COMPLETED', riskScore: 23, distance: '12.4 km' },
  { id: '2', startAddress: 'Main Street Station', endAddress: 'Riverside Mall', startTime: new Date(Date.now() - 7200000).toISOString(), status: 'COMPLETED', riskScore: 45, distance: '8.2 km' },
  { id: '3', startAddress: 'Tech Park', endAddress: 'City Center', startTime: new Date(Date.now() - 14400000).toISOString(), status: 'COMPLETED', riskScore: 12, distance: '15.7 km' },
];

const hazardAlerts: HazardAlert[] = [
  { id: '1', type: 'Pothole', severity: 'HIGH', location: 'Oak Avenue & 5th St', distance: '0.3 km', time: '5 min ago' },
  { id: '2', type: 'Flooding', severity: 'CRITICAL', location: 'River Road', distance: '1.2 km', time: '12 min ago' },
  { id: '3', type: 'Construction', severity: 'MEDIUM', location: 'Highway 101 Exit 4', distance: '2.5 km', time: '25 min ago' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function DriverDashboardPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, Alex</h1>
            <p className="text-muted-foreground mt-1">Here&apos;s your driving overview for today</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} glass className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter
                          value={stat.value}
                          className="text-2xl font-bold"
                        />
                        {stat.suffix && (
                          <span className="text-lg text-muted-foreground">{stat.suffix}</span>
                        )}
                      </div>
                    </div>
                    <div className={cn('p-2.5 rounded-xl', stat.color)}>
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
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-left text-primary-foreground shadow-lg shadow-primary/25"
                  onClick={() => navigate('/trips')}
                >
                  <div className="relative z-10">
                    <Play className="h-6 w-6 mb-2" />
                    <p className="font-semibold text-sm">Start Trip</p>
                    <p className="text-xs opacity-80 mt-0.5">Begin a new drive</p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-10">
                    <Car className="h-24 w-24" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-left text-white shadow-lg shadow-emerald-500/25"
                  onClick={() => navigate('/routes')}
                >
                  <div className="relative z-10">
                    <Route className="h-6 w-6 mb-2" />
                    <p className="font-semibold text-sm">Plan Route</p>
                    <p className="text-xs opacity-80 mt-0.5">Analyze road safety</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-left text-white shadow-lg shadow-amber-500/25"
                  onClick={() => navigate('/hazards/new')}
                >
                  <div className="relative z-10">
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <p className="font-semibold text-sm">Report Hazard</p>
                    <p className="text-xs opacity-80 mt-0.5">Alert others to danger</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-left text-white shadow-lg shadow-violet-500/25"
                  onClick={() => navigate('/map')}
                >
                  <div className="relative z-10">
                    <Map className="h-6 w-6 mb-2" />
                    <p className="font-semibold text-sm">View Map</p>
                    <p className="text-xs opacity-80 mt-0.5">Live safety overview</p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Quick Route Check</CardTitle>
              <CardDescription>Check safety of a route</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="start">Starting Point</Label>
                <Input id="start" placeholder="Enter address..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest">Destination</Label>
                <Input id="dest" placeholder="Enter address..." />
              </div>
              <Button className="w-full gap-2" onClick={() => navigate('/routes')}>
                <Shield className="h-4 w-4" />
                Check Safety
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Trips</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/trips')}>
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTrips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{trip.startAddress} → {trip.endAddress}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(trip.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{trip.distance}</span>
                    <Badge variant={trip.riskScore <= 25 ? 'low' : trip.riskScore <= 50 ? 'medium' : 'high'}>
                      {trip.riskScore}
                    </Badge>
                    <Badge
                      variant={trip.status === 'COMPLETED' ? 'low' : trip.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {trip.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Hazard Alerts Nearby</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/hazards')}>
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {hazardAlerts.map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/hazards/${alert.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg',
                      alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                      alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-amber-500/10 text-amber-500'
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{alert.distance}</span>
                    <Badge
                      variant={
                        alert.severity === 'CRITICAL' ? 'critical' :
                        alert.severity === 'HIGH' ? 'high' :
                        alert.severity === 'MEDIUM' ? 'medium' : 'low'
                      }
                      pulse={alert.severity === 'CRITICAL'}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
