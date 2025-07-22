"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import AlertsButton from "./alerts/AlertsButton";
import dynamic from "next/dynamic";
import { useAppSelector } from "../lib/hooks";
import { loggedIn } from "../lib/slices/authSlice";
import { useEffect, useState } from "react";

const AuthenticationNavigation = dynamic(
  () => import("./authentication/AuthenticationNavigation"),
  { ssr: false },
);

// Main app navigation for authenticated users
const appNavigation = [
  { name: "Dashboard", to: "/dashboard" },
  { name: "Agents", to: "/agents" },
  { name: "Workflows", to: "/workflows" },
  { name: "Knowledge", to: "/knowledge" },
  { name: "Collaboration", to: "/collaboration" },
];

// Public navigation for non-authenticated users
const publicNavigation = [
  // Removed generic pages - focus on AI Agent platform
];

const renderIcon = (open: boolean) => {
  if (!open) {
    return <Bars3Icon className="block h-6 w-6" aria-hidden="true" />;
  } else {
    return <XMarkIcon className="block h-6 w-6" aria-hidden="true" />;
  }
};

const renderNavLinks = (style: string, isLoggedIn: boolean) => {
  const navigation = isLoggedIn ? appNavigation : publicNavigation;
  return navigation.map((nav) => (
    <Link href={nav.to} key={nav.name} className={style}>
      {nav.name}
    </Link>
  ));
};

export default function Navigation() {
  const isLoggedIn = useAppSelector(loggedIn);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <header>
        <nav className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/" className="flex flex-shrink-0 items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-rose-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">V</span>
                    </div>
                    <span className="hidden lg:block text-xl font-bold text-gray-900">
                      Vexel
                    </span>
                  </div>
                </Link>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <AlertsButton />
              <AuthenticationNavigation />
            </div>
          </div>
        </nav>
      </header>
    );
  }
  return (
    <header>
      <Disclosure as="nav">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-500">
                    <span className="sr-only">Open main menu</span>
                    {renderIcon(open)}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center">
                    <Link href="/" className="flex flex-shrink-0 items-center">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-rose-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">V</span>
                        </div>
                        <span className="hidden lg:block text-xl font-bold text-gray-900">
                          Vexel
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {renderNavLinks(
                      "inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-rose-500",
                      isLoggedIn
                    )}
                    {/* Add prominent Dashboard button for authenticated users */}
                    {isLoggedIn && (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                      >
                        🚀 Go to App
                      </Link>
                    )}
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <AlertsButton />
                  <AuthenticationNavigation />
                </div>
              </div>
            </div>
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pt-2 pb-4">
                {/* Add prominent Dashboard button for mobile */}
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="block mx-3 mb-3 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 text-center"
                  >
                    🚀 Go to App
                  </Link>
                )}
                {renderNavLinks(
                  "block hover:border-l-4 hover:border-rose-500 hover:bg-rose-50 py-2 pl-3 pr-4 text-base font-medium text-rose-700",
                  isLoggedIn
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </header>
  );
}
