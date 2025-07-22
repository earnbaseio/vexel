"use client";

import { usePathname } from "next/navigation";
import ModernNavigation from "./ModernNavigation";
import Notification from "./Notification";
import ModernFooter from "./ModernFooter";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current route is a dashboard route
  const isDashboard = pathname.startsWith("/dashboard") || 
                     pathname.startsWith("/agents") || 
                     pathname.startsWith("/chat") || 
                     pathname.startsWith("/workflows") || 
                     pathname.startsWith("/knowledge") || 
                     pathname.startsWith("/collaboration") || 
                     pathname.startsWith("/analytics") || 
                     pathname.startsWith("/settings");

  // For dashboard routes, render children directly (dashboard layout will handle its own layout)
  if (isDashboard) {
    return <>{children}</>;
  }

  // For public routes, render with header and footer
  return (
    <div className="min-h-screen bg-slate-900">
      <slot name="header">
        <ModernNavigation />
      </slot>
      <main className="pt-16">
        {children}
      </main>
      <slot name="footer">
        <Notification />
        <ModernFooter />
      </slot>
    </div>
  );
}
