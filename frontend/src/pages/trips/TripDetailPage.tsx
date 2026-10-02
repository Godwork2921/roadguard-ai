import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Clock,
  Gauge,
  Zap,
  AlertTriangle,
  ChevronLeft,
  TrendingUp,
  Speedometer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { RiskIndicator } from '@/components/ui/risk-indicator';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Timeline } from '@/components/ui/timeline';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

const mockTripLocations = [
  { time: '09:00', location: 'Downtown Hub', lat: 40.7128, lng: -74.006 },
  { time: '09:15', location: 'Broadway & Canal St', lat: 40.718, lng: -74.002 },
  { time: '09:30', location: '5th Ave & 34th St', lat: 40.748, lng: -73.985 },
  { time: '09:45', location: 'Central Park South', lat: 40.764, lng: -73.977 },
  { time: '10:00', location: 'Airport Terminal 2', lat: 40.641, lng: -73.778 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PageContainer>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/trips')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Trip Details</h1>
            <p className="text-sm text-muted-foreground">ID: {id?.slice(0, 8) || 'trip-1234'}</p>
          </div>
          <Badge variant="low" className="ml-auto">COMPLETED</Badge>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Distance', value: 12.4, suffix: 'km', icon: Navigation, color: 'text-blue-500 bg-blue-500/10' },
            { label: 'Duration', value: 1, suffix: 'h 12m', icon: Clock, color: 'text-primary bg-primary/10' },
            { label: 'Avg Speed', value: 42, suffix: 'km/h', icon: Speedometer, color: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Max Speed', value: 78, suffix: 'km/h', icon: Gauge, color: 'text-amber-500 bg-amber-500/10' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} glass>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <div className="flex items-baseline gap-1">
                        <AnimatedCounter value={stat.value} className="text-2xl font-bold" decimals={stat.suffix === 'km' ? 1 : 0} />
                        <span className="text-sm text-muted-foreground">{stat.suffix}</span>
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
              <CardTitle className="text-lg">Route Map</CardTitle>
              <CardDescription>Downtown Hub → Airport Terminal 2</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px] rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.06)_0%,transparent_50%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Map visualization</p>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between glass rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Downtown Hub</span>
                  </div>
                  <div className="h-px flex-1 mx-2 border-t border-dashed border-muted-foreground/30" />
                  <div className="flex items-center gap-2">
                    <span>Airport Terminal 2</span>
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Risk Score</CardTitle>
              <CardDescription>Overall trip risk assessment</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <RiskIndicator score={23} size="lg" />
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hazards Encountered</span>
                  <span className="font-medium">2</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Road Quality</span>
                  <span className="font-medium text-emerald-500">Good</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weather Impact</span>
                  <span className="font-medium text-amber-500">Moderate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Location Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                items={mockTripLocations.map((loc, idx) => ({
                  id: `loc-${idx}`,
                  title: loc.location,
                  description: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                  timestamp: loc.time,
                  status: idx === mockTripLocations.length - 1 ? 'completed' : 'completed',
                }))}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Risk Score Breakdown</CardTitle>
              <CardDescription>Factors contributing to risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Road Surface', score: 15, max: 25 },
                { label: 'Traffic Density', score: 5, max: 20 },
                { label: 'Weather Conditions', score: 3, max: 20 },
                { label: 'Driver Behavior', score: 0, max: 20 },
                { label: 'Hazard Density', score: 0, max: 15 },
              ].map((factor) => (
                <div key={factor.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{factor.label}</span>
                    <span className={cn(
                      'font-medium',
                      factor.score <= factor.max * 0.3 ? 'text-emerald-500' :
                      factor.score <= factor.max * 0.6 ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {factor.score}/{factor.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        factor.score <= factor.max * 0.3 ? 'bg-emerald-500' :
                        factor.score <= factor.max * 0.6 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${(factor.score / factor.max) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
