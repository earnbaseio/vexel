"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "../../lib/hooks";
import { loggedIn } from "../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { UserGroupIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function Collaboration() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/authentication");
    }
  }, [isLoggedIn, mounted, router]);

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
            <p className="mt-2 text-gray-600">
              Coordinate multi-agent teams and collaborative sessions
            </p>
          </div>
          <button
            onClick={() => router.push("/collaboration/start")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Start Session
          </button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new collaboration session.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/collaboration/start")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
