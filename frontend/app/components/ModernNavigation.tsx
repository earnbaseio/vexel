"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SparklesIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AlertsButton from "./alerts/AlertsButton";
import dynamic from "next/dynamic";
import { useAppSelector } from "../lib/hooks";
import { loggedIn } from "../lib/slices/authSlice";
import { useEffect, useState, Fragment } from "react";

const AuthenticationNavigation = dynamic(
  () => import("./authentication/AuthenticationNavigation"),
  { ssr: false },
);

// Main app navigation for authenticated users
const appNavigation = [
  { name: "Dashboard", to: "/dashboard", icon: "🏠", description: "Overview & Analytics" },
  { name: "Agents", to: "/agents", icon: "🤖", description: "AI Agent Management" },
  { name: "Workflows", to: "/workflows", icon: "⚡", description: "Automation Flows" },
  { name: "Knowledge", to: "/knowledge", icon: "🧠", description: "Vector Database" },
  { name: "Collaboration", to: "/collaboration", icon: "🤝", description: "Team Workspace" },
];

// Public navigation for non-authenticated users
const publicNavigation = [
  { name: "Features", to: "#features", icon: "✨", description: "Platform Capabilities" },
  { name: "Pricing", to: "#pricing", icon: "💰", description: "Plans & Pricing" },
  { name: "About", to: "#about", icon: "ℹ️", description: "Company Info" },
];

// User menu items
const userMenuItems = [
  { name: "Profile", to: "/profile", icon: "👤" },
  { name: "Settings", to: "/settings", icon: "⚙️" },
  { name: "Billing", to: "/billing", icon: "💳" },
  { name: "Support", to: "/support", icon: "🎧" },
  { name: "Sign Out", to: "/logout", icon: "🚪" },
];

export default function ModernNavigation() {
  const isLoggedIn = useAppSelector(loggedIn);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fix hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animated particles for logo
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    duration: 2 + i * 0.3,
  }));

  const renderNavLinks = (navigation: typeof appNavigation, isMobile = false) => {
    if (isMobile) {
      return navigation.map((nav, index) => (
        <motion.div
          key={nav.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={nav.to}
            className="group flex items-center space-x-4 px-4 py-4 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl">{nav.icon}</span>
            </div>
            <div className="flex-1">
              <div className="font-medium">{nav.name}</div>
              <div className="text-sm text-white/50">{nav.description}</div>
            </div>
          </Link>
        </motion.div>
      ));
    }

    return navigation.map((nav) => (
      <motion.div
        key={nav.name}
        className="relative group"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href={nav.to}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/80 hover:text-white transition-all duration-300 group-hover:bg-white/10"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">{nav.icon}</span>
          <span className="font-medium">{nav.name}</span>
        </Link>

        {/* Tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {nav.description}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
        </div>
      </motion.div>
    ));
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <span className="text-xl font-bold text-white">Vexel</span>
              </div>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        className={`relative transition-all duration-500 ${
          scrolled
            ? "bg-slate-900/95 backdrop-blur-xl border-b border-white/20 shadow-2xl shadow-purple-500/10"
            : "bg-gradient-to-r from-slate-900/90 via-purple-900/80 to-slate-900/90 backdrop-blur-md border-b border-white/10"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
              style={{
                left: `${10 + particle.id * 15}%`,
                top: "50%",
              }}
            />
          ))}
        </div>
        <Disclosure as="nav" className="relative z-10">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                  {/* Mobile menu button */}
                  <div className="flex items-center sm:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-xl p-3 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group">
                      <span className="sr-only">Open main menu</span>
                      <AnimatePresence mode="wait">
                        {open ? (
                          <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="group-hover:scale-110 transition-transform"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="group-hover:scale-110 transition-transform"
                          >
                            <Bars3Icon className="h-6 w-6" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Disclosure.Button>
                  </div>

                  {/* Enhanced Logo */}
                  <motion.div
                    className="flex items-center space-x-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/" className="flex items-center space-x-4 group">
                      <div className="relative">
                        <motion.div
                          className="w-12 h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300"
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-white font-bold text-2xl">V</span>
                        </motion.div>
                        {/* Sparkle effect */}
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3"
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
                          <SparklesIcon className="w-3 h-3 text-yellow-400" />
                        </motion.div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300">
                          Vexel
                        </span>
                        <span className="text-xs text-white/50 font-medium tracking-wider">
                          AI PLATFORM
                        </span>
                      </div>
                    </Link>
                  </motion.div>

                  {/* Desktop Navigation & Search */}
                  <div className="hidden lg:flex lg:items-center lg:space-x-8 flex-1 justify-center">
                    {/* Navigation Links */}
                    <div className="flex items-center space-x-2">
                      {renderNavLinks(isLoggedIn ? appNavigation : publicNavigation)}
                    </div>

                    {/* Search Bar */}
                    {isLoggedIn && (
                      <motion.div
                        className="relative"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <div className={`relative transition-all duration-300 ${
                          isSearchFocused ? "scale-105" : ""
                        }`}>
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                          <input
                            type="text"
                            placeholder="Search agents, workflows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="w-80 pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all duration-300"
                          />
                          {searchQuery && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    {isLoggedIn && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        <button className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/15 transition-all duration-300">
                          <BellIcon className="h-5 w-5" />
                          {/* Notification badge */}
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        </button>
                      </motion.div>
                    )}

                    {/* User Menu */}
                    {isLoggedIn ? (
                      <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="hidden sm:block text-left">
                            <div className="text-sm font-medium text-white">John Doe</div>
                            <div className="text-xs text-white/50">Pro Plan</div>
                          </div>
                          <ChevronDownIcon className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
                        </Menu.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-150"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl py-2">
                            {userMenuItems.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <Link
                                    href={item.to}
                                    className={`flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                                      active ? "bg-white/10 text-white" : "text-white/70"
                                    }`}
                                  >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.name}</span>
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link
                            href="/login"
                            className="px-6 py-3 text-white/80 hover:text-white font-medium transition-colors"
                          >
                            Sign In
                          </Link>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link
                            href="/register"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                          >
                            <RocketLaunchIcon className="h-4 w-4 mr-2" />
                            Get Started
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Mobile Navigation Panel */}
              <AnimatePresence>
                {open && (
                  <Disclosure.Panel static>
                    <motion.div
                      className="lg:hidden bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-t border-white/10"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <div className="px-6 py-8 space-y-6">
                        {/* Mobile Search */}
                        {isLoggedIn && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                          >
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                            <input
                              type="text"
                              placeholder="Search..."
                              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                            />
                          </motion.div>
                        )}

                        {/* Mobile CTA Button */}
                        {!isLoggedIn && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <Link
                              href="/register"
                              className="flex items-center justify-center space-x-3 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
                            >
                              <RocketLaunchIcon className="h-5 w-5" />
                              <span>Get Started Free</span>
                            </Link>
                          </motion.div>
                        )}

                        {/* Mobile Navigation Links */}
                        <div className="space-y-3">
                          {renderNavLinks(isLoggedIn ? appNavigation : publicNavigation, true)}
                        </div>

                        {/* Mobile User Section */}
                        {isLoggedIn && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="pt-6 border-t border-white/10"
                          >
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <UserCircleIcon className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium">John Doe</div>
                                <div className="text-white/50 text-sm">Pro Plan</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {userMenuItems.slice(0, 4).map((item, index) => (
                                <motion.div
                                  key={item.name}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.4 + index * 0.05 }}
                                >
                                  <Link
                                    href={item.to}
                                    className="flex items-center space-x-2 px-4 py-3 bg-white/5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                                  >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </Disclosure.Panel>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>
      </motion.div>
    </header>
  );
}
