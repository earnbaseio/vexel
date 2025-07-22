"use client"

import { useAppDispatch, useAppSelector } from "../lib/hooks"
import { register, signUp, loggedIn } from "../lib/slices/authSlice"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
  FieldValues,
  useForm,
} from "react-hook-form";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import FloatingInput from "../components/ui/FloatingInput";
import GradientButton from "../components/ui/GradientButton";
import PasswordRequirements from "../components/ui/PasswordRequirements";
import EmailVerificationNotice from "../components/ui/EmailVerificationNotice";

const schema = {
  firstName: { required: true, minLength: 2, maxLength: 50 },
  lastName: { required: true, minLength: 2, maxLength: 50 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, minLength: 8, maxLength: 64 },
  confirmPassword: { required: true },
  terms: { required: true },
};

const redirectAfterRegister = "/login";

function UnsuspendedPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")
  const dispatch = useAppDispatch()
  const isLoggedIn = useAppSelector((state) => loggedIn(state))
  const router = useRouter();

  const redirectTo = (route: string) => {
    router.push(route);
  };

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  async function submit(data: FieldValues) {
    if (data.password !== data.confirmPassword) {
      return;
    }
    if (!acceptTerms) {
      return;
    }

    setIsLoading(true);
    try {
      // Use new unified auth API for registration
      await dispatch(
        signUp({
          email: data.email,
          password: data.password,
          fullName: `${data.firstName} ${data.lastName}`
        }),
      );
      // Registration successful - user is now logged in
      // No need for email verification with new auth system
    } catch (error) {
      // If new auth fails, fallback to legacy registration
      try {
        await dispatch(
          register({
            email: data.email,
            password: data.password,
            full_name: `${data.firstName} ${data.lastName}`
          }),
        );
        // Show email verification notice for legacy registration
        setRegisteredEmail(data.email);
        setShowEmailVerification(true);
      } catch (legacyError) {
        console.error('Both new and legacy registration failed:', error, legacyError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) return redirectTo("/dashboard");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated particles for background
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 0.1,
    duration: 3 + Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <motion.div
                className="flex justify-center mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25">
                    <span className="text-white font-bold text-3xl">V</span>
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360] 
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Join Vexel AI
              </h1>
              <p className="text-white/70">
                Create your account and start building intelligent AI agents
              </p>
            </div>

            {/* Form */}
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <form onSubmit={handleSubmit(submit)} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInput
                    {...registerField("firstName", schema.firstName)}
                    label="First Name"
                    type="text"
                    autoComplete="given-name"
                    icon={<UserIcon className="h-5 w-5" />}
                    error={errors.firstName}
                    required
                  />
                  <FloatingInput
                    {...registerField("lastName", schema.lastName)}
                    label="Last Name"
                    type="text"
                    autoComplete="family-name"
                    icon={<UserIcon className="h-5 w-5" />}
                    error={errors.lastName}
                    required
                  />
                </div>

                {/* Email Field */}
                <FloatingInput
                  {...registerField("email", schema.email)}
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                  error={errors.email}
                  required
                />

                {/* Password Field */}
                <div className="space-y-3">
                  <FloatingInput
                    {...registerField("password", schema.password)}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    icon={<LockClosedIcon className="h-5 w-5" />}
                    rightIcon={
                      showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )
                    }
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    error={errors.password}
                    required
                  />

                  {/* Password Requirements */}
                  <PasswordRequirements
                    password={password}
                    isVisible={showPasswordRequirements && password.length > 0}
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <FloatingInput
                    {...registerField("confirmPassword", schema.confirmPassword)}
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    icon={<LockClosedIcon className="h-5 w-5" />}
                    rightIcon={
                      showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )
                    }
                    onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    error={errors.confirmPassword}
                    required
                  />
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2 text-sm"
                    >
                      {password === confirmPassword ? (
                        <>
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XMarkIcon className="h-4 w-4 text-red-400" />
                          <span className="text-red-400">Passwords don't match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <motion.button
                    type="button"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      acceptTerms 
                        ? "bg-purple-600 border-purple-600" 
                        : "border-white/30 hover:border-white/50"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {acceptTerms && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckIcon className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                  <div className="text-sm text-white/70 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
                      Privacy Policy
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <GradientButton
                  type="submit"
                  disabled={isLoading || !acceptTerms || password !== confirmPassword}
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                  rightIcon={!isLoading && <ArrowRightIcon className="h-5 w-5" />}
                >
                  Create Account
                </GradientButton>
              </form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:px-12">
          <motion.div
            className="max-w-md text-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-8">
              <motion.div
                className="w-32 h-32 mx-auto bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-4xl">🚀</span>
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Start Your AI Journey
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Join thousands of developers and enterprises building the future with
                intelligent AI agents and autonomous workflows.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "🎯 Free Tier Available",
                "⚡ Quick 5-minute Setup",
                "🔒 Enterprise-grade Security",
                "🌟 24/7 Community Support"
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center space-x-3 text-white/80"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Email Verification Notice */}
      <EmailVerificationNotice
        email={registeredEmail}
        isVisible={showEmailVerification}
      />
    </main>
  );
}

export default function Page() {
  return <Suspense><UnsuspendedPage /></Suspense>
}
