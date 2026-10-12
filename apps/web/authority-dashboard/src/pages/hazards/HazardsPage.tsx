import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Plus,
  Download,
  CheckCircle2,
  UserCheck,
  Wrench,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataGrid, type Column } from '@/components/ui/data-grid';
import { PageContainer } from '@/components/layout/page-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateTime, cn } from '@/lib/utils';
import { getHazards } from '@/lib/storage';
import type { Hazard, HazardSeverity, HazardStatus, HazardType } from '@/types';

const mockHazards: Hazard[] = Array.from({ length: 25 }, (_, i) => ({
  id: `haz-${i + 1}`,
  hazardType: (['POTHOLE', 'ROAD_CRACK', 'FLOOD', 'ACCIDENT', 'ROAD_BLOCKAGE', 'CONSTRUCTION', 'DEBRIS'] as HazardType[])[i % 7]!,
  severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as HazardSeverity[])[i % 4]!,
  status: (['DETECTED', 'REPORTED', 'VERIFIED', 'ASSIGNED', 'RESOLVED'] as HazardStatus[])[i % 5]!,
  latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
  longitude: -74.006 + (Math.random() - 0.5) * 0.1,
  description: `Description for hazard ${i + 1}`,
  address: `${100 + i} Main Street, New York, NY`,
  confidenceScore: Math.round(Math.random() * 40 + 60),
  reportedById: `user-${(i % 10) + 1}`,
  reportedByName: [`John D.`, `Sarah M.`, `AI System`, `Officer C.`, `Mike R.`][i % 5]!,
  verifiedById: i % 3 === 0 ? `verifier-${i}` : null,
  verifiedByName: i % 3 === 0 ? `Officer Chen` : null,
  isVerified: i % 3 === 0,
  isAIDetected: i % 4 === 0,
  source: i % 4 === 0 ? 'AI' : 'USER',
  region: (['Downtown', 'Suburbs', 'Highway', 'Industrial'] as any)[i % 4],
  roadName: [`Broadway`, `5th Ave`, `Highway 101`, `Oak Street`][i % 4]!,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  updatedAt: new Date(Date.now() - i * 1800000).toISOString(),
  resolvedAt: i % 5 === 4 ? new Date().toISOString() : null,
  imageUrls: [],
}));

const severityVariant: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'low' | 'medium' | 'outline'> = {
  DETECTED: 'medium', REPORTED: 'default', VERIFIED: 'low', ASSIGNED: 'secondary', RESOLVED: 'low', FIXED: 'low', REJECTED: 'outline',
};

export default function HazardsPage() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());

  const allHazards: Hazard[] = React.useMemo(() => {
    const saved = getHazards().map((h) => ({
      id: h.id,
      hazardType: h.type as HazardType,
      severity: h.severity as HazardSeverity,
      status: 'REPORTED' as HazardStatus,
      latitude: h.latitude,
      longitude: h.longitude,
      description: h.description,
      address: `${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}`,
      confidenceScore: 100,
      reportedById: 'user-1',
      reportedByName: 'You',
      verifiedById: null,
      verifiedByName: null,
      isVerified: false,
      isAIDetected: false,
      source: 'USER',
      region: 'Addis Ababa',
      roadName: null,
      createdAt: h.timestamp,
      updatedAt: h.timestamp,
      resolvedAt: null,
      imageUrls: h.photoUrl ? [h.photoUrl] : [],
    }));
    return [...saved, ...mockHazards];
  }, []);

  const columns: Column<Hazard>[] = [
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'hazardType',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded-lg',
            item.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
            item.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
            item.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
            'bg-emerald-500/10 text-emerald-500'
          )}>
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium capitalize">{item.hazardType.replace(/_/g, ' ').toLowerCase()}</span>
        </div>
      ),
    },
    {
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      cell: (item) => (
        <Badge variant={severityVariant[item.severity]} pulse={item.severity === 'CRITICAL'}>
          {item.severity}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (item) => (
        <Badge variant={statusVariant[item.status] || 'outline'}>
          {item.status}
        </Badge>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item) => (
        <div className="min-w-0">
          <p className="text-sm truncate max-w-[200px]">{item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}</p>
          <p className="text-xs text-muted-foreground">{item.region}</p>
        </div>
      ),
    },
    {
      id: 'reportedBy',
      header: 'Reported By',
      accessorKey: 'reportedByName',
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (item) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(item.createdAt)}</span>
      ),
    },
    {
      id: 'confidence',
      header: 'Confidence',
      accessorKey: 'confidenceScore',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                (item.confidenceScore ?? 0) >= 80 ? 'bg-emerald-500' :
                (item.confidenceScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${item.confidenceScore ?? 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-medium">{item.confidenceScore ?? 'N/A'}%</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '60px',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => navigate(`/hazards/${item.id}`)}>
              <AlertTriangle className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle2 className="h-4 w-4" />
              Verify
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserCheck className="h-4 w-4" />
              Assign
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Wrench className="h-4 w-4" />
              Resolve
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Hazard Management"
      description="View, verify, and manage all reported road hazards"
      actions={
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm">Verify All</Button>
              <Button variant="outline" size="sm">Assign</Button>
            </motion.div>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/hazards/report')}>
            <Plus className="h-4 w-4" />
            Report Hazard
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
                  <SelectItem value="DETECTED">Detected</SelectItem>
                  <SelectItem value="REPORTED">Reported</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Hazard Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="POTHOLE">Pothole</SelectItem>
                  <SelectItem value="FLOOD">Flood</SelectItem>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="ROAD_BLOCKAGE">Road Blockage</SelectItem>
                  <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="downtown">Downtown</SelectItem>
                  <SelectItem value="suburbs">Suburbs</SelectItem>
                  <SelectItem value="highway">Highway</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardContent className="p-0">
            <DataGrid
              data={allHazards}
              columns={columns}
              keyExtractor={(item) => item.id}
              pageSize={10}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(item) => navigate(`/hazards/${item.id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
