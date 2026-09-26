import Link from 'next/link';
import { LayoutDashboard, Grid, ChefHat, Settings, MessageSquare, Truck, PieChart, ClipboardList, FileSpreadsheet, Shield, Combine } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r min-h-[calc(100vh-4rem)] bg-muted/20 flex flex-col p-4 space-y-2">
      <Link href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
      </Link>
      <Link href="/tables" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Grid className="w-5 h-5 mr-3" /> Tables & Billing
      </Link>
      <Link href="/kds" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <ChefHat className="w-5 h-5 mr-3" /> Kitchen (KDS)
      </Link>
      <Link href="/delivery" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Truck className="w-5 h-5 mr-3" /> Delivery Manager
      </Link>
      <Link href="/menu-engineering" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <PieChart className="w-5 h-5 mr-3" /> Menu Engineering
      </Link>
      <Link href="/inventory" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <ClipboardList className="w-5 h-5 mr-3" /> Inventory & Waste
      </Link>
      <Link href="/reconciliation" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <FileSpreadsheet className="w-5 h-5 mr-3" /> Bank Reconciliation
      </Link>
      <Link href="/audit-logs" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Shield className="w-5 h-5 mr-3" /> Audit & Security
      </Link>
      <Link href="/pos-comparison" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Combine className="w-5 h-5 mr-3" /> Tally & Integrations
      </Link>
      <Link href="/whatsapp" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <MessageSquare className="w-5 h-5 mr-3" /> WhatsApp API
      </Link>
      <Link href="/restaurant-settings" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Settings className="w-5 h-5 mr-3" /> Settings
      </Link>
    </aside>
  );
}
