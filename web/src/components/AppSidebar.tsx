"use client"

import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Grid,
  ChefHat,
  Truck,
  PieChart,
  ClipboardList,
  FileSpreadsheet,
  Shield,
  Combine,
  MessageSquare,
  Settings,
  Users,
  Coffee,
  CalendarDays,
  PackageSearch,
} from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAppStore } from "@/store/useAppStore"
import { maxLevelForPath, roleLevelOf } from "@/lib/permissions"

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tables & Billing", url: "/tables", icon: Grid },
  { title: "Kitchen (KDS)", url: "/kds", icon: ChefHat },
  { title: "Delivery Manager", url: "/delivery", icon: Truck },
  { title: "Menu Engineering", url: "/menu-engineering", icon: PieChart },
  { title: "Inventory & Waste", url: "/inventory", icon: ClipboardList },
  { title: "Inventory Expiry", url: "/inventory-expiry", icon: PackageSearch },
  { title: "Employee Schedule", url: "/employee-schedule", icon: CalendarDays },
  { title: "Bank Reconciliation", url: "/reconciliation", icon: FileSpreadsheet },
  { title: "Audit & Security", url: "/audit-logs", icon: Shield },
  { title: "Tally & Integrations", url: "/pos-comparison", icon: Combine },
  { title: "WhatsApp API", url: "/whatsapp", icon: MessageSquare },
  { title: "Customer History", url: "/customer-history", icon: Users },
  { title: "Settings", url: "/restaurant-settings", icon: Settings },
]

export function AppSidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const token = useAppStore((state) => state.token)
  const level = roleLevelOf(currentUser)
  const [restaurantName, setRestaurantName] = useState("My Restaurant")

  useEffect(() => {
    if (!token || !currentUser?.restaurantId) return
    fetch(`http://127.0.0.1:8000/api/restaurants/${currentUser.restaurantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.name) setRestaurantName(data.name) })
      .catch(() => {})
  }, [token, currentUser?.restaurantId])

  const visibleItems = items.filter((item) => {
    const maxLevel = maxLevelForPath(item.url)
    if (maxLevel == null || level == null) return true
    return level <= maxLevel
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="bg-primary flex aspect-square size-8 items-center justify-center rounded-lg text-primary-foreground">
                <Coffee className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{restaurantName}</span>
                <span className="truncate text-xs">Restaurant Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
