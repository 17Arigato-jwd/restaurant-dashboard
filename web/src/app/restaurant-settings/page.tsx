"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Store, Receipt, Printer, Bell, ShieldAlert, Save, Trash2, PowerOff } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("outlet");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
        <p className="text-muted-foreground mt-1">Manage outlet configuration, hardware, and operational defaults.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar for Settings */}
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "outlet"} 
              onClick={() => setActiveTab("outlet")}
            >
              <Store /> <span>Outlet Details</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "taxes"} 
              onClick={() => setActiveTab("taxes")}
            >
              <Receipt /> <span>Taxes & Compliance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "hardware"} 
              onClick={() => setActiveTab("hardware")}
            >
              <Printer /> <span>Hardware & Printers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "notifications"} 
              onClick={() => setActiveTab("notifications")}
            >
              <Bell /> <span>Notifications</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeTab === "danger"} 
              onClick={() => setActiveTab("danger")}
              className={activeTab === 'danger' ? 'bg-red-200 text-red-900 border-red-900 dark:bg-red-900 dark:text-red-100' : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40'}
            >
              <ShieldAlert /> <span>Danger Zone</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Settings Content Area */}
        <div className="md:col-span-3">
          
          {activeTab === "outlet" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Outlet Information</CardTitle>
                <CardDescription>Primary details displayed on bills and customer receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Restaurant Name</Label>
                    <Input defaultValue="Easy Restaurant SPA" />
                  </div>
                  <div className="space-y-2">
                    <Label>Concept Type</Label>
                    <Input defaultValue="Casual Dining" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input defaultValue="123 Food Street, Koramangala, Bangalore 560034" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Support Phone (Printed on Bill)</Label>
                    <Input defaultValue="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label>FSSAI License Number</Label>
                    <Input defaultValue="11223344556677" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button><Save className="w-4 h-4 mr-2" /> Save Outlet Details</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "taxes" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Taxes & Charges</CardTitle>
                <CardDescription>Configure GST and mandatory operational charges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Enable Standard 5% GST</h4>
                    <p className="text-sm text-muted-foreground">Applies 2.5% CGST + 2.5% SGST without Input Tax Credit.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Enable Service Charge</h4>
                    <p className="text-sm text-muted-foreground">Automatically add 10% Service Charge to Dine-In bills.</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Packaging Charge (Delivery)</h4>
                    <p className="text-sm text-muted-foreground">Flat ₹20 per order for Aggregators & ONDC.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button><Save className="w-4 h-4 mr-2" /> Save Tax Rules</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "hardware" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Hardware & Printers</CardTitle>
                <CardDescription>Manage local thermal printers and KDS routing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex justify-between items-center bg-muted/10">
                  <div>
                    <h4 className="font-bold text-sm">Front Desk Printer (Billing)</h4>
                    <p className="text-xs text-muted-foreground mt-1">IP: 192.168.1.100 (Epson TM-T82X)</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">Online</Badge>
                </div>
                <div className="p-4 border rounded-lg flex justify-between items-center bg-muted/10">
                  <div>
                    <h4 className="font-bold text-sm">Kitchen Printer (KOT Backup)</h4>
                    <p className="text-xs text-muted-foreground mt-1">IP: 192.168.1.101 (TVS RP 3200)</p>
                  </div>
                  <Badge variant="destructive">Offline</Badge>
                </div>
                <Button variant="outline" className="w-full">Discover New Printers on Network</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Manager Notifications</CardTitle>
                <CardDescription>Configure which alerts are sent via SMS or Email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Critical Inventory Variances</h4>
                    <p className="text-xs text-muted-foreground mt-1">Alert when physical stock variance exceeds 2%.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Suspicious Voids / Overrides</h4>
                    <p className="text-xs text-muted-foreground mt-1">Alert when a cashier cancels a paid bill.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Daily End-of-Day Report</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receive the Tally summary email at midnight.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "danger" && (
            <Card className="border-red-200 dark:border-red-900 animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 pb-4">
                <CardTitle className="text-red-700 dark:text-red-500 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600/80 dark:text-red-400/80">
                  Destructive actions that cannot be easily undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <div>
                    <h4 className="font-bold text-sm">Factory Reset POS Data</h4>
                    <p className="text-xs text-muted-foreground mt-1">Erases all offline local storage, tables, and mock data.</p>
                  </div>
                  <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Reset Local Data</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <div>
                    <h4 className="font-bold text-sm">Force Shut Down API Bridge</h4>
                    <p className="text-xs text-muted-foreground mt-1">Disconnects Aggregators & Tally immediately.</p>
                  </div>
                  <Button variant="destructive" size="sm"><PowerOff className="w-4 h-4 mr-2" /> Disconnect APIs</Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
