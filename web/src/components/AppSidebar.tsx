"use client"

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
} from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
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
  { title: "Bank Reconciliation", url: "/reconciliation", icon: FileSpreadsheet },
  { title: "Audit & Security", url: "/audit-logs", icon: Shield },
  { title: "Tally & Integrations", url: "/pos-comparison", icon: Combine },
  { title: "WhatsApp API", url: "/whatsapp", icon: MessageSquare },
  { title: "Customer History", url: "/customer-history", icon: Users },
  { title: "Settings", url: "/restaurant-settings", icon: Settings },
]

export function AppSidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const level = roleLevelOf(currentUser)

  const visibleItems = items.filter((item) => {
    const maxLevel = maxLevelForPath(item.url)
    if (maxLevel == null || level == null) return true
    return level <= maxLevel
  })

  return (
    <Sidebar collapsible="icon">
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
