import * as React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Car,
  Shield,
  Moon,
  Sun,
  Monitor,
  Save,
  Camera,
  Eye,
  EyeOff,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/types';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

const mockVehicles: Vehicle[] = [
  { id: 'v1', userId: 'u1', name: 'My Car', plateNumber: 'ABC-1234', type: 'SEDAN', make: 'Toyota', model: 'Camry', year: 2023, color: 'Silver', isActive: true, createdAt: '2026-01-15' },
  { id: 'v2', userId: 'u1', name: 'Work Van', plateNumber: 'XYZ-5678', type: 'VAN', make: 'Ford', model: 'Transit', year: 2022, color: 'White', isActive: false, createdAt: '2026-03-01' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [vehicles] = React.useState(mockVehicles);

  const handleSave = async (section: string) => {
    setSaving(section);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(null);
  };

  return (
    <PageContainer
      title="Settings"
      description="Manage your account preferences"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList variant="underline" className="w-full">
          <TabsTrigger value="profile" variant="underline"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" variant="underline"><Bell className="h-4 w-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="vehicles" variant="underline"><Car className="h-4 w-4 mr-2" />Vehicles</TabsTrigger>
          <TabsTrigger value="security" variant="underline"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="appearance" variant="underline"><Moon className="h-4 w-4 mr-2" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl space-y-6">
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <motion.div variants={itemVariants} className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 ring-2 ring-border">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg">{user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}</AvatarFallback>
                    </Avatar>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                  <div>
                    <p className="font-semibold">{user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Driver'}</p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.firstName ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.lastName ?? ''} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email ?? ''} />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue={user?.phone ?? ''} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button className="gap-2" onClick={() => handleSave('profile')} loading={saving === 'profile'}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl space-y-6">
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div variants={itemVariants}>
                  <ToggleSwitch
                    label="Hazard Alerts"
                    description="Get notified about hazards on your route"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Separator />
                  <ToggleSwitch
                    label="Weather Alerts"
                    description="Severe weather warnings in your area"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Separator />
                  <ToggleSwitch
                    label="Route Safety Updates"
                    description="Safety score changes for your planned routes"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Separator />
                  <ToggleSwitch
                    label="Trip Summaries"
                    description="Detailed summary after each trip"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Separator />
                  <ToggleSwitch
                    label="System Announcements"
                    description="New features and platform updates"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Separator />
                  <ToggleSwitch
                    label="Marketing Emails"
                    description="Tips, news, and promotional content"
                    checked={false}
                    onChange={() => {}}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="vehicles">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl space-y-6">
            <Card glass>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">My Vehicles</CardTitle>
                    <CardDescription>Manage your registered vehicles</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Vehicle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2.5 rounded-xl',
                        vehicle.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model} · {vehicle.plateNumber} · {vehicle.color}
                        </p>
                        <p className="text-xs text-muted-foreground">{vehicle.year} · {vehicle.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl space-y-6">
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="currentPw">Current Password</Label>
                  <Input
                    id="currentPw"
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Enter current password"
                    rightIcon={
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-muted-foreground hover:text-foreground">
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="newPw">New Password</Label>
                  <Input
                    id="newPw"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Enter new password"
                    rightIcon={
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-muted-foreground hover:text-foreground">
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button className="gap-2" onClick={() => handleSave('security')} loading={saving === 'security'}>
                    <Shield className="h-4 w-4" />
                    Update Password
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl space-y-6">
            <Card glass>
              <CardHeader>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>Customize the interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Label className="mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map(({ value, icon: Icon, label }) => (
                      <motion.button
                        key={value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                          value === 'dark'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{label}</span>
                        {value === 'dark' && <Check className="h-4 w-4 text-primary" />}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
