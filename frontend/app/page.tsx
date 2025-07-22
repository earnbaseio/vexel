"use client";

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "./lib/hooks"
import { loggedIn, magicLogin } from "./lib/slices/authSlice"
import { tokenIsTOTP } from "./lib/utilities"
import { token } from "./lib/slices/tokensSlice"
import ModernHero from "./components/home/ModernHero"
import InteractiveFeatures from "./components/home/InteractiveFeatures"
import AnimatedStats from "./components/home/AnimatedStats"
import ModernCTA from "./components/home/ModernCTA"

const redirectTOTP = "/totp";
const redirectAfterLogin = "/dashboard";

function UnsuspendedPage() {
  const router = useRouter()
  const query = useSearchParams()

  const dispatch = useAppDispatch();

  const accessToken = useAppSelector((state) => token(state));
  const isLoggedIn = useAppSelector((state) => loggedIn(state));

  useEffect(() => {
    async function load() {
      // Check if email is being validated
      if (query && query.get("magic")) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 100);
        });
        if (!isLoggedIn)
          await dispatch(magicLogin({ token: query.get("magic") as string }));
        if (tokenIsTOTP(accessToken)) router.push(redirectTOTP);
        else router.push(redirectAfterLogin);
      } else if (isLoggedIn) {
        // If user is already logged in, redirect to dashboard
        router.push(redirectAfterLogin);
      }
    }
    load();
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show modern welcome page for non-logged in users
  return (
    <main className="min-h-screen">
      <ModernHero />
      <InteractiveFeatures />
      <AnimatedStats />
      <ModernCTA />
    </main>
  );
}

export default function Page() {
  return <Suspense><UnsuspendedPage /></Suspense>
}