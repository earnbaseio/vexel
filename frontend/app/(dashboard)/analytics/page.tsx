"use client";

import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, CpuChipIcon } from "@heroicons/react/24/outline";

const stats = [
  {
    name: "Total Agents",
    value: "12",
    change: "+4.75%",
    changeType: "positive",
    icon: CpuChipIcon,
  },
  {
    name: "Active Workflows",
    value: "8",
    change: "+54.02%",
    changeType: "positive", 
    icon: ChartBarIcon,
  },
  {
    name: "Team Members",
    value: "24",
    change: "-1.39%",
    changeType: "negative",
    icon: UsersIcon,
  },
  {
    name: "Success Rate",
    value: "98.5%",
    change: "+10.18%",
    changeType: "positive",
    icon: ArrowTrendingUpIcon,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Monitor your AI agents and workflow performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 dark:bg-gray-800"
          >
            <dt>
              <div className="absolute rounded-md bg-purple-500 p-3">
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
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Agent Performance
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart will be implemented when backend API is ready
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Workflow Success Rate
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart will be implemented when backend API is ready
          </div>
        </div>
      </div>
    </div>
  );
}
