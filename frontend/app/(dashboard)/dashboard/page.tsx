"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "../../lib/hooks";
import { loggedIn } from "../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  CpuChipIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// TODO: Implement real stats from API
// TODO: Implement real activities from API

const quickActions = [
  {
    name: "Create Agent",
    description: "Deploy a new AI agent",
    href: "/agents/create",
    icon: CpuChipIcon,
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Start Workflow",
    description: "Begin an agentic workflow",
    href: "/workflows/create",
    icon: Cog6ToothIcon,
    color: "from-green-500 to-green-600",
  },
  {
    name: "Add Knowledge",
    description: "Upload to knowledge base",
    href: "/knowledge/upload",
    icon: DocumentTextIcon,
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Team Collaboration",
    description: "Start team session",
    href: "/collaboration/start",
    icon: UserGroupIcon,
    color: "from-orange-500 to-orange-600",
  },
];

const stats = [
  {
    name: "Active Agents",
    value: "12",
    change: "+4.75%",
    changeType: "positive",
    icon: CpuChipIcon,
  },
  {
    name: "Running Workflows",
    value: "8",
    change: "+54.02%",
    changeType: "positive",
    icon: Cog6ToothIcon,
  },
  {
    name: "Knowledge Items",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive",
    icon: DocumentTextIcon,
  },
  {
    name: "Success Rate",
    value: "98.5%",
    change: "+2.1%",
    changeType: "positive",
    icon: ArrowTrendingUpIcon,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "agent_created",
    title: "New agent 'Customer Support Bot' created",
    time: "2 minutes ago",
    icon: CpuChipIcon,
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    type: "workflow_completed",
    title: "Data Analysis workflow completed successfully",
    time: "15 minutes ago",
    icon: CheckCircleIcon,
    iconColor: "text-green-600",
  },
  {
    id: 3,
    type: "knowledge_uploaded",
    title: "New documents uploaded to knowledge base",
    time: "1 hour ago",
    icon: DocumentTextIcon,
    iconColor: "text-purple-600",
  },
  {
    id: 4,
    type: "collaboration_started",
    title: "Team collaboration session started",
    time: "2 hours ago",
    icon: UserGroupIcon,
    iconColor: "text-orange-600",
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white"
      >
        <h1 className="text-2xl font-bold">
          Welcome back, User! 👋
        </h1>
        <p className="mt-2 text-purple-100">
          Here's what's happening with your AI agents today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow duration-200 dark:bg-gray-800"
          >
            <dt>
              <div className="absolute rounded-md bg-gradient-to-r from-purple-500 to-blue-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</p>
              <p
                className={classNames(
                  item.changeType === "positive" ? "text-green-600" : "text-red-600",
                  "ml-2 flex items-baseline text-sm font-semibold"
                )}
              >
                {item.change}
              </p>
            </dd>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white shadow rounded-lg dark:bg-gray-800"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 cursor-pointer transition-all duration-200"
                  onClick={() => router.push(action.href)}
                >
                  <div>
                    <span
                      className={`bg-gradient-to-r ${action.color} rounded-lg inline-flex p-3 ring-4 ring-white dark:ring-gray-800`}
                    >
                      <action.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {action.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white shadow rounded-lg dark:bg-gray-800"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-800`}>
                            <activity.icon className={`h-4 w-4 ${activity.iconColor}`} aria-hidden="true" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {activity.title}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            <time>{activity.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
