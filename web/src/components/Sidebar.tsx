import Link from 'next/link';
import { LayoutDashboard, Grid, ChefHat, Settings, Truck } from 'lucide-react';

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
      <Link href="/settings" className="flex items-center p-3 rounded-lg hover:bg-muted transition-colors">
        <Settings className="w-5 h-5 mr-3" /> Settings
      </Link>
    </aside>
  );
}
