"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/toast";
import { roleLevelOf } from "@/lib/permissions";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Explicitly allowed role ids (e.g. ['r1', 'r2']). */
  allowedRoles?: string[];
  /** Maximum (least privileged) role level allowed, e.g. 2 for Owner/Manager. */
  maxLevel?: number;
  fallbackRoute?: string;
}

/**
 * Client-side content guard. The shell already blocks whole routes by role, but
 * this additionally protects individual panels/tabs and shows a toast.
 */
export function RoleGuard({
  children,
  allowedRoles,
  maxLevel,
  fallbackRoute = "/dashboard",
}: RoleGuardProps) {
  const router = useRouter();
  const { role, currentUser } = useAppStore();
  const level = roleLevelOf(currentUser);

  const allowedByRole = !allowedRoles || (role != null && allowedRoles.includes(role));
  const allowedByLevel = maxLevel == null || level == null || level <= maxLevel;
  const allowed = allowedByRole && allowedByLevel;

  useEffect(() => {
    if (!allowed) {
      toast.add({
        type: "error",
        title: "Access Denied",
        description: "You do not have permission to view this content.",
      });
      router.replace(fallbackRoute);
    }
  }, [allowed, router, fallbackRoute]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
