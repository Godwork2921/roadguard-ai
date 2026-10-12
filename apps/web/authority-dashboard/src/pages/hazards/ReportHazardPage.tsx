import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  MapPin,
  Send,
  CheckCircle2,
  ChevronLeft,
  Target,
  Camera,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '@/components/layout/page-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { saveHazard, generateId } from '@/lib/storage';
import type { HazardType, HazardSeverity } from '@/types';

const reportSchema = z.object({
  hazardType: z.string().min(1, 'Please select a hazard type'),
  severity: z.string().min(1, 'Please select severity'),
  latitude: z.string().min(1, 'Location is required'),
  longitude: z.string().min(1, 'Location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const hazardTypes: { value: HazardType; label: string; icon: string }[] = [
  { value: 'POTHOLE', label: 'Pothole', icon: '🕳️' },
  { value: 'ROAD_CRACK', label: 'Road Crack', icon: '〰️' },
  { value: 'FLOOD', label: 'Flooding', icon: '🌊' },
  { value: 'ACCIDENT', label: 'Accident', icon: '💥' },
  { value: 'ROAD_BLOCKAGE', label: 'Road Blockage', icon: '🚧' },
  { value: 'CONSTRUCTION', label: 'Construction', icon: '🏗️' },
  { value: 'ANIMAL_CROSSING', label: 'Animal Crossing', icon: '🦌' },
  { value: 'DEBRIS', label: 'Debris', icon: '🗑️' },
  { value: 'OTHER', label: 'Other', icon: '❓' },
];

export default function ReportHazardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = location.state as { prefill?: { latitude: string; longitude: string }; fromTrip?: boolean; hazards?: any[]; hazardCount?: number } | null;
  const { addCoins } = useAuth();

  const [step, setStep] = React.useState(1);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [coinsEarned, setCoinsEarned] = React.useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      hazardType: '',
      severity: '',
      latitude: incomingState?.prefill?.latitude ?? '',
      longitude: incomingState?.prefill?.longitude ?? '',
      description: incomingState?.fromTrip
        ? `Auto-detected hazard during trip from (${incomingState?.prefill?.latitude || '?'}, ${incomingState?.prefill?.longitude || '?'}). Detected by vehicle sensors.`
        : '',
      address: '',
    },
  });

  const watchedType = watch('hazardType');
  const watchedSeverity = watch('severity');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');

  const previewData = {
    type: hazardTypes.find((t) => t.value === watchedType),
    severity: watchedSeverity,
    lat: watchedLat,
    lng: watchedLng,
  };

  const onSubmit = async (data: ReportFormData) => {
    saveHazard({
      id: generateId(),
      tripId: '',
      type: data.hazardType,
      severity: data.severity,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      description: data.description,
      timestamp: new Date().toISOString(),
    });
    await new Promise((r) => setTimeout(r, 1500));
    addCoins(30);
    setCoinsEarned(30);
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 2000));
    navigate('/hazards');
  };

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude.toFixed(6));
        setValue('longitude', pos.coords.longitude.toFixed(6));
      },
      () => {
        setValue('latitude', '9.030000');
        setValue('longitude', '38.740000');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  React.useEffect(() => {
    if (incomingState?.prefill?.latitude) return;
    handleGetLocation();
  }, []);

  if (showSuccess) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 mx-auto"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">Hazard Reported!</h2>
              <p className="text-muted-foreground mt-1">Thank you for helping keep roads safe.</p>
              {coinsEarned > 0 && (
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"
                >
                  <span className="text-xl">🪙</span>
                  <span className="font-bold text-amber-500">+{coinsEarned} coins</span>
                </motion.div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/hazards')}>
                View All Hazards
              </Button>
              <Button onClick={() => { setShowSuccess(false); setStep(1); }}>
                Report Another
              </Button>
            </div>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Report a Hazard"
      description="Help keep the roads safe by reporting hazards"
    >
      <div className="max-w-2xl mx-auto">
        <Card glass>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">New Hazard Report</CardTitle>
                <CardDescription>Fill in the details about the hazard</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <motion.div
                    key={s}
                    className={cn('h-2 w-2 rounded-full', s <= step ? 'bg-primary' : 'bg-muted-foreground/30')}
                    animate={{ scale: s === step ? 1.3 : 1 }}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label>Hazard Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {hazardTypes.map((type) => (
                          <motion.button
                            key={type.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setValue('hazardType', type.value)}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all',
                              watchedType === type.value
                                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-xs font-medium">{type.label}</span>
                          </motion.button>
                        ))}
                      </div>
                      {errors.hazardType && <p className="text-xs text-destructive">{errors.hazardType.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as HazardSeverity[]).map((sev) => (
                          <motion.button
                            key={sev}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setValue('severity', sev)}
                            className={cn(
                              'p-3 rounded-xl border text-center text-sm font-medium transition-all',
                              watchedSeverity === sev
                                ? sev === 'CRITICAL' ? 'border-red-500 bg-red-500/10 text-red-500 shadow-sm'
                                  : sev === 'HIGH' ? 'border-orange-500 bg-orange-500/10 text-orange-500 shadow-sm'
                                  : sev === 'MEDIUM' ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-sm'
                                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm'
                                : 'border-border hover:border-muted-foreground/30'
                            )}
                          >
                            {sev}
                          </motion.button>
                        ))}
                      </div>
                      {errors.severity && <p className="text-xs text-destructive">{errors.severity.message}</p>}
                    </div>

                    <Button type="button" className="w-full" size="lg" onClick={() => setStep(2)}>
                      Continue to Location
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        className="relative w-full h-48 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden border border-border cursor-pointer"
                        onClick={handleGetLocation}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_60%)]" />
                        {(watchedLat && watchedLng) ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex flex-col items-center gap-1"
                            >
                              <motion.div
                                animate={{ y: [-4, 4, -4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <MapPin className="h-8 w-8 text-primary" />
                              </motion.div>
                              <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                                {parseFloat(watchedLat).toFixed(4)}, {parseFloat(watchedLng).toFixed(4)}
                              </span>
                            </motion.div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Tap to detect your location</p>
                            </div>
                          </div>
                        )}
                      </motion.button>
                      {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          placeholder="9.0300"
                          {...register('latitude')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          placeholder="38.7400"
                          {...register('longitude')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address (optional)</Label>
                      <Input
                        id="address"
                        placeholder="Street address or intersection"
                        {...register('address')}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="button" className="flex-1" size="lg" onClick={() => setStep(3)}>
                        Continue to Details
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        error={!!errors.description}
                        placeholder="Describe the hazard in detail (size, location on road, time observed, etc.)"
                        className="resize-none"
                        {...register('description')}
                      />
                      {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Photos (optional)</Label>
                      <div className="flex items-center gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Add photos</span>
                        </motion.button>
                      </div>
                    </div>

                    {previewData.type && (
                      <Alert variant="info">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Preview</AlertTitle>
                        <AlertDescription>
                          Reporting a {previewData.severity?.toLowerCase()} severity {previewData.type.label.toLowerCase()}{' '}
                          at ({previewData.lat}, {previewData.lng})
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" size="lg" loading={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        {!isSubmitting && <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
