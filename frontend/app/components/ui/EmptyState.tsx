"use client";

import React from "react";
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "search" | "add" | "warning" | "document" | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "document",
  action,
  className = ""
}) => {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconClasses = "h-12 w-12 text-gray-400";
    
    switch (icon) {
      case "search":
        return <MagnifyingGlassIcon className={iconClasses} />;
      case "add":
        return <PlusIcon className={iconClasses} />;
      case "warning":
        return <ExclamationTriangleIcon className={iconClasses} />;
      case "document":
      default:
        return <DocumentIcon className={iconClasses} />;
    }
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            action.variant === "secondary"
              ? "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500"
              : "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          }`}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
