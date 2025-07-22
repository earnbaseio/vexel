"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "../lib/hooks";
import { loggedIn } from "../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Add a small delay to ensure redux-persist rehydration is complete
    if (mounted) {
      const timer = setTimeout(() => {
        if (!isLoggedIn) {
          router.push("/login");
        }
      }, 100); // Small delay to allow rehydration

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, mounted, router]);

  // Show loading while mounting or not authenticated
  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 rounded-full h-32 w-32 border-t-2 border-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Header */}
        <DashboardHeader 
          setSidebarOpen={setSidebarOpen}
        />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
