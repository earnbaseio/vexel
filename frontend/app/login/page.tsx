"use client"

import { useAppDispatch, useAppSelector } from "../lib/hooks"
import { signIn, loggedIn } from "../lib/slices/authSlice"
import { useRouter, useSearchParams } from "next/navigation"
import { tokenIsTOTP } from "../lib/utilities"
import { Suspense, useEffect, useState } from "react"
import {
  FieldValues,
  useForm,
} from "react-hook-form";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import FloatingInput from "../components/ui/FloatingInput";
import GradientButton from "../components/ui/GradientButton";

const schema = {
  email: { required: true },
  password: { required: true, minLength: 8, maxLength: 64 },
};

const redirectAfterLogin = "/";
const redirectTOTP = "/totp";

function UnsuspendedPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.tokens.access_token)
  const isLoggedIn = useAppSelector((state) => loggedIn(state))
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectTo = (route: string) => {
    router.push(route);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm({
    defaultValues: {
      email: "admin@vexel.com",
      password: "changethis"
    }
  });

  async function submit(data: FieldValues) {
    setIsLoading(true);
    try {
      // Use unified auth API for email & password login
      await dispatch(
        signIn({ email: data["email"], password: data["password"] }),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) return redirectTo(redirectAfterLogin);
    if (accessToken && tokenIsTOTP(accessToken) && isSubmitSuccessful)
      return redirectTo(redirectTOTP);
  }, [isLoggedIn, accessToken, isSubmitSuccessful]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated particles for background
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.1,
    duration: 3 + Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

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
                Welcome to Vexel AI
              </h1>
              <p className="text-white/70">
                Sign in to your account
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
                {/* Email Field */}
                <FloatingInput
                  {...register("email", schema.email)}
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
                    {...register("password", schema.password)}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    icon={<LockClosedIcon className="h-5 w-5" />}
                    rightIcon={
                      showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )
                    }
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    error={errors.password}
                    required
                  />

                  <div className="text-right">
                    <Link
                      href="/recover-password"
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                  rightIcon={!isLoading && <ArrowRightIcon className="h-5 w-5" />}
                >
                  Sign In
                </GradientButton>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Sign up for free
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
                  <span className="text-white font-bold text-4xl">🤖</span>
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Next-Generation AI Platform
              </h2>
              <p className="text-white/70 text-lg leading-relaxed">
                Build, deploy, and scale intelligent AI agents with advanced memory,
                reasoning, and team collaboration capabilities.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "🧠 Advanced Memory & Reasoning",
                "🤝 Multi-Agent Collaboration",
                "⚡ Autonomous Workflows",
                "🔍 Vector Knowledge Base"
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
    </main>
  );
}

export default function Page() {
  return <Suspense><UnsuspendedPage /></Suspense>
}