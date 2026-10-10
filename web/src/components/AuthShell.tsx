"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { maxLevelForPath, roleLevelOf } from "@/lib/permissions";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

/** Routes that must be reachable without a session. */
const PUBLIC_PATHS = ["/login", "/register"];

/** Tracks whether the persisted Zustand session has been rehydrated on the client. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useAppStore.persist.onFinishHydration(onStoreChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAppStore((state) => state.token);
  const mustChangePassword = useAppStore((state) => state.mustChangePassword);
  const currentUser = useAppStore((state) => state.currentUser);
  const hydrated = useHydrated();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const level = roleLevelOf(currentUser);
  const pageMaxLevel = maxLevelForPath(pathname);
  const blockedByRole =
    !isPublic && token && level != null && pageMaxLevel != null && level > pageMaxLevel;

  const fetchLiveTables = useAppStore((state) => state.fetchLiveTables);

  useEffect(() => {
    if (token && hydrated && !isPublic) {
      let active = true;
      const poll = () => { if (active) fetchLiveTables(); };
      poll();
      const interval = setInterval(poll, 3000);
      return () => { active = false; clearInterval(interval); };
    }
  }, [token, hydrated, isPublic, fetchLiveTables]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isPublic && !token) {
      router.replace("/login");
    } else if (isPublic && token) {
      router.replace(mustChangePassword ? "/change-password" : "/dashboard");
    } else if (token && mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    } else if (blockedByRole) {
      router.replace("/dashboard");
    }
  }, [hydrated, isPublic, token, mustChangePassword, pathname, blockedByRole, router]);

  // Avoid flashing either the login screen or the dashboard before the persisted
  // session has been rehydrated on the client.
  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!token) {
    return <div className="min-h-screen bg-background" />;
  }

  // The forced password-change screen is intentionally chrome-free.
  if (pathname === "/change-password") {
    return <>{children}</>;
  }

  if (mustChangePassword || blockedByRole) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-muted/10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
