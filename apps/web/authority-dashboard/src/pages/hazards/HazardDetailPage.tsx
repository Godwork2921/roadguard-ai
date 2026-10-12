import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  UserCheck,
  Wrench,
  Send,
  Image,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Timeline } from '@/components/ui/timeline';
import { PageContainer } from '@/components/layout/page-container';
import { Progress } from '@/components/ui/progress';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { Hazard, HazardSeverity } from '@/types';

const mockHazard: Hazard = {
  id: 'haz-1',
  hazardType: 'POTHOLE',
  severity: 'HIGH',
  status: 'VERIFIED',
  latitude: 40.7128,
  longitude: -74.006,
  description: 'Large pothole approximately 3 feet wide and 6 inches deep on the right lane of Broadway. Causing vehicles to swerve dangerously to avoid it. Multiple near-misses reported.',
  address: '250 Broadway, New York, NY 10007',
  confidenceScore: 92,
  reportedById: 'user-3',
  reportedByName: 'Sarah Mitchell',
  verifiedById: 'off-1',
  verifiedByName: 'Officer Chen',
  isVerified: true,
  isAIDetected: false,
  source: 'USER',
  region: 'Downtown',
  roadName: 'Broadway',
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  updatedAt: new Date(Date.now() - 1800000).toISOString(),
  resolvedAt: null,
  imageUrls: [],
};

const nearbyHazards = [
  { id: 'haz-2', type: 'ROAD_CRACK', severity: 'MEDIUM' as HazardSeverity, distance: '0.2 mi', address: 'Broadway & Chambers St' },
  { id: 'haz-3', type: 'DEBRIS', severity: 'LOW' as HazardSeverity, distance: '0.4 mi', address: 'Broadway & Vesey St' },
  { id: 'haz-4', type: 'FLOOD', severity: 'CRITICAL' as HazardSeverity, distance: '0.6 mi', address: 'Church St & Dey St' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function HazardDetailPage() {
  useParams();
  const navigate = useNavigate();
  const [comment, setComment] = React.useState('');

  const hazard = mockHazard;

  const severityVariant: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical',
  };

  return (
    <PageContainer>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Card glass>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={cn(
                      'p-2.5 rounded-xl',
                      hazard.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                      hazard.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                      hazard.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    )}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold capitalize">{hazard.hazardType.replace(/_/g, ' ').toLowerCase()}</h1>
                      <p className="text-sm text-muted-foreground">ID: {hazard.id}</p>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Badge variant={severityVariant[hazard.severity]} pulse={hazard.severity === 'CRITICAL'} className="text-sm px-3 py-1">
                        {hazard.severity}
                      </Badge>
                      <Badge variant={hazard.status === 'RESOLVED' ? 'low' : hazard.status === 'VERIFIED' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                        {hazard.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="relative h-48 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_50%,rgba(239,68,68,0.1)_0%,transparent_50%)]" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="glass rounded-lg px-3 py-2 text-xs">
                        <p className="font-medium">{hazard.latitude.toFixed(6)}, {hazard.longitude.toFixed(6)}</p>
                        <p className="text-muted-foreground">{hazard.address}</p>
                      </div>
                      <Button size="sm" variant="secondary" className="glass gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        View on Map
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Reported By</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{hazard.reportedByName}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Date Reported</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatDateTime(hazard.createdAt)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Region</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{hazard.region}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Road Name</p>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{hazard.roadName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Confidence Score</p>
                    <div className="flex items-center gap-3">
                      <Progress value={hazard.confidenceScore ?? 0} variant="risk" className="flex-1 max-w-xs" showLabel />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{hazard.description}</p>
                  </div>

                  {hazard.imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Images</p>
                      <div className="flex gap-2">
                        {hazard.imageUrls.map((_url, idx) => (
                          <div key={idx} className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:w-72 space-y-3">
                  <Card glass>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                      <Button className="w-full justify-start gap-2" variant="default" size="sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Verify Hazard
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <UserCheck className="h-4 w-4" />
                        Assign to Crew
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <Wrench className="h-4 w-4" />
                        Mark Resolved
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                        <XCircle className="h-4 w-4" />
                        Reject Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card glass>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Nearby Hazards</p>
                      <div className="space-y-2">
                        {nearbyHazards.map((nh) => (
                          <motion.button
                            key={nh.id}
                            whileHover={{ x: 4 }}
                            className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            onClick={() => navigate(`/hazards/${nh.id}`)}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate capitalize">{nh.type.replace(/_/g, ' ').toLowerCase()}</p>
                              <p className="text-[10px] text-muted-foreground">{nh.address}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground">{nh.distance}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Verification History</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                items={[
                  { id: '1', title: 'Reported', description: `Reported by ${hazard.reportedByName}`, timestamp: formatRelativeTime(hazard.createdAt), status: 'completed' },
                  { id: '2', title: 'AI Analysis', description: 'AI confidence score: 92% - Pothole detected', timestamp: formatRelativeTime(new Date(Date.now() - 5400000).toISOString()), status: 'completed' },
                  { id: '3', title: 'Verified', description: hazard.verifiedByName ? `Verified by ${hazard.verifiedByName}` : 'Pending verification', timestamp: hazard.verifiedByName ? formatRelativeTime(new Date(Date.now() - 3600000).toISOString()) : undefined, status: hazard.isVerified ? 'completed' : 'current' },
                  { id: '4', title: 'Assigned', description: 'Pending assignment to maintenance crew', status: 'pending' },
                  { id: '5', title: 'Resolved', description: 'Awaiting resolution', status: 'pending' },
                ]}
              />
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-lg">Notes & Comments</CardTitle>
              <CardDescription>Add notes about this hazard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button size="icon" disabled={!comment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  { author: 'Officer Chen', text: 'Verified pothole. Needs immediate repair due to high traffic area.', time: '2 hours ago' },
                  { author: 'Sarah Mitchell', text: 'Almost hit this pothole last night. Very dangerous in the dark.', time: '3 hours ago' },
                ].map((note, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{note.author}</span>
                      <span className="text-[10px] text-muted-foreground">{note.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.text}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
