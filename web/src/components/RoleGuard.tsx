"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/toast";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[]; // e.g. ['r1', 'r2']
  fallbackRoute?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackRoute = "/dashboard" }: RoleGuardProps) {
  const router = useRouter();
  const { role, currentUser } = useAppStore();

  useEffect(() => {
    // Only run the check if we have finished hydrating (indicated by a non-null role or currentUser, though initial state might be null until fetch)
    // Wait, since Zustand state persists, `role` should be available immediately on mount.
    if (role && !allowedRoles.includes(role)) {
      toast.add({ type: "error", title: "Access Denied", description: "You do not have permission to view this page." });
      router.push(fallbackRoute);
    }
  }, [role, allowedRoles, router, fallbackRoute]);

  // If role is missing or not allowed, render null to prevent flash of restricted content
  if (!role || !allowedRoles.includes(role)) {
    return null; 
  }

  return <>{children}</>;
}
