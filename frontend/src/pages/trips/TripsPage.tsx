import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navigation, Download, Filter, Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataGrid, type Column } from '@/components/ui/data-grid';
import { PageContainer } from '@/components/layout/page-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, formatDateTime, formatDuration, formatDistance } from '@/lib/utils';
import { getTrips } from '@/lib/storage';
import type { Trip, TripStatus } from '@/types';

const savedTrips = getTrips() as Trip[];

function RecentTripCard({ trip }: { trip: Trip }) {
  const navigate = useNavigate();
  const duration = trip.endTime && trip.startTime
    ? Math.round((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / 60000)
    : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
      onClick={() => navigate(`/trips/${trip.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="low" className="text-[10px]">Just now</Badge>
        <Badge variant={trip.riskScore && trip.riskScore <= 25 ? 'low' : 'medium'}>
          Risk: {trip.riskScore ?? 'N/A'}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="truncate">{trip.startAddress || 'Unknown'}</span>
        <span className="text-muted-foreground">→</span>
        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
        <span className="truncate">{trip.endAddress || 'Unknown'}</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {duration} min
        </span>
        <span>{trip.totalDistance ? formatDistance(trip.totalDistance) : 'N/A'}</span>
        {trip.maxSpeed && <span>Max: {trip.maxSpeed} km/h</span>}
      </div>
    </motion.div>
  );
}

const mockTrips: Trip[] = Array.from({ length: 30 }, (_, i) => ({
  id: `trip-${i + 1}`,
  driverId: 'driver-1',
  driverName: 'Alex Johnson',
  startLat: 40.7128 + (Math.random() - 0.5) * 0.05,
  startLng: -74.006 + (Math.random() - 0.5) * 0.05,
  endLat: 40.758 + (Math.random() - 0.5) * 0.05,
  endLng: -73.9855 + (Math.random() - 0.5) * 0.05,
  startAddress: [`Downtown Hub`, `Main Street`, `Grand Central`, `Times Square`][i % 4],
  endAddress: [`Airport`, `Riverside Mall`, `Central Park`, `Brooklyn Bridge`][i % 4],
  startTime: new Date(Date.now() - i * 86400000).toISOString(),
  endTime: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
  status: (['ACTIVE', 'COMPLETED', 'COMPLETED', 'CANCELLED'] as TripStatus[])[i % 4],
  riskScore: Math.floor(Math.random() * 100),
  totalDistance: Math.floor(Math.random() * 30000) + 2000,
  averageSpeed: Math.floor(Math.random() * 30) + 20,
  maxSpeed: Math.floor(Math.random() * 40) + 50,
}));

const statusVariant: Record<string, 'default' | 'low' | 'medium' | 'secondary'> = {
  ACTIVE: 'default',
  COMPLETED: 'low',
  CANCELLED: 'secondary',
  ABORTED: 'medium',
};

export default function TripsPage() {
  const navigate = useNavigate();

  const columns: Column<Trip>[] = [
    {
      id: 'date',
      header: 'Date',
      cell: (item) => (
        <div>
          <p className="text-sm font-medium">{formatDateTime(item.startTime)}</p>
          <p className="text-xs text-muted-foreground">ID: {item.id.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      cell: (item) => (
        <div className="min-w-0">
          <p className="text-sm truncate max-w-[200px]">
            {item.startAddress || 'Unknown'} → {item.endAddress || 'Unknown'}
          </p>
        </div>
      ),
    },
    {
      id: 'distance',
      header: 'Distance',
      cell: (item) => (
        <span className="text-sm font-medium">{item.totalDistance ? formatDistance(item.totalDistance) : 'N/A'}</span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (item) => {
        if (!item.startTime || !item.endTime) return <span className="text-sm text-muted-foreground">In progress</span>;
        const seconds = (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 1000;
        return <span className="text-sm">{formatDuration(seconds)}</span>;
      },
    },
    {
      id: 'riskScore',
      header: 'Risk Score',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                (item.riskScore ?? 0) <= 25 ? 'bg-emerald-500' :
                (item.riskScore ?? 0) <= 50 ? 'bg-amber-500' :
                (item.riskScore ?? 0) <= 75 ? 'bg-orange-500' : 'bg-red-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${item.riskScore ?? 0}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className={cn(
            'text-xs font-medium',
            (item.riskScore ?? 0) <= 25 ? 'text-emerald-500' :
            (item.riskScore ?? 0) <= 50 ? 'text-amber-500' :
            (item.riskScore ?? 0) <= 75 ? 'text-orange-500' : 'text-red-500'
          )}>
            {item.riskScore ?? 'N/A'}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={statusVariant[item.status] || 'secondary'} pulse={item.status === 'ACTIVE'}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="Trip History"
      description="View and manage all your trips"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/routes')}>
            <Navigation className="h-4 w-4" />
            Plan a Trip
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Card glass>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low (0-25)</SelectItem>
                  <SelectItem value="moderate">Moderate (26-50)</SelectItem>
                  <SelectItem value="high">High (51-75)</SelectItem>
                  <SelectItem value="critical">Critical (76-100)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {savedTrips.length > 0 && savedTrips[0] && (
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm">Recent Trip</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <RecentTripCard trip={savedTrips[0]} />
              {savedTrips.length > 1 && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {savedTrips.slice(1, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm" onClick={() => navigate(`/trips/${t.id}`)}>
                        <span className="truncate text-xs">{t.startAddress} → {t.endAddress}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{t.totalDistance ? formatDistance(t.totalDistance) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card glass>
          <CardContent className="p-0">
            <DataGrid
              data={mockTrips}
              columns={columns}
              keyExtractor={(item) => item.id}
              pageSize={10}
              onRowClick={(item) => navigate(`/trips/${item.id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
