import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['DRIVER', 'PASSENGER']),
    acceptTerms: z.boolean().refine((v) => v === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  if (score <= 25) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 50) return { score, label: 'Fair', color: 'text-orange-500' };
  if (score <= 75) return { score, label: 'Good', color: 'text-amber-500' };
  return { score, label: 'Strong', color: 'text-emerald-500' };
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'DRIVER',
      acceptTerms: false,
    },
  });

  const password = watch('password');
  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-[40%] -right-[20%] h-[80%] w-[60%] rounded-full bg-primary/10 blur-[120px]"
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-[30%] -left-[20%] h-[70%] w-[50%] rounded-full bg-primary/8 blur-[100px]"
          animate={{ rotate: [360, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_60%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10 px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4"
            whileHover={{ scale: 1.05, rotate: -3 }}
          >
            <svg className="h-7 w-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground mt-1">Join RoadGuard AI today</p>
        </motion.div>

        <Card glass className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sign Up</CardTitle>
                <CardDescription>Fill in your details to get started</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((s) => (
                  <motion.div
                    key={s}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      s <= step ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                    animate={{ scale: s === step ? 1.3 : 1 }}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                <Alert variant="error" dismissible>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    variants={staggerContainer}
                    className="space-y-4"
                  >
                    <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          leftIcon={<User className="h-4 w-4" />}
                          error={!!errors.firstName}
                          {...register('firstName')}
                        />
                        {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          error={!!errors.lastName}
                          {...register('lastName')}
                        />
                        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        leftIcon={<Mail className="h-4 w-4" />}
                        error={!!errors.email}
                        {...register('email')}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </motion.div>

                    <motion.div variants={staggerItem} className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        leftIcon={<Phone className="h-4 w-4" />}
                        error={!!errors.phone}
                        {...register('phone')}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </motion.div>

                    <motion.div variants={staggerItem} className="space-y-2">
                      <Label htmlFor="role">I am a</Label>
                      <Select defaultValue="DRIVER" onValueChange={() => {}}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRIVER">Driver</SelectItem>
                          <SelectItem value="PASSENGER">Passenger</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Button
                        type="button"
                        className="w-full h-11 text-base"
                        size="lg"
                        onClick={() => setStep(2)}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    variants={staggerContainer}
                    className="space-y-4"
                  >
                    <motion.div variants={staggerItem} className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        leftIcon={<Lock className="h-4 w-4" />}
                        rightIcon={
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                        error={!!errors.password}
                        {...register('password')}
                      />
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                      {password && (
                        <div className="space-y-1">
                          <Progress value={passwordStrength.score} variant="risk" />
                          <p className={cn('text-xs font-medium', passwordStrength.color)}>
                            {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </motion.div>

                    <motion.div variants={staggerItem} className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        leftIcon={<Lock className="h-4 w-4" />}
                        rightIcon={
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                        error={!!errors.confirmPassword}
                        {...register('confirmPassword')}
                      />
                      {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                    </motion.div>

                    <motion.div variants={staggerItem} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        className="rounded border-border h-4 w-4 text-primary focus:ring-primary mt-0.5"
                        {...register('acceptTerms')}
                      />
                      <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                        I accept the{' '}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </motion.div>
                    {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>}

                    <motion.div variants={staggerItem} className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={() => setStep(1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-11 text-base"
                        size="lg"
                        loading={isSubmitting}
                      >
                        {isSubmitting ? 'Creating account...' : 'Create Account'}
                        {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
