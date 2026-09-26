"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Store, Receipt, Printer, Bell, ShieldAlert, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
        <p className="text-muted-foreground mt-1">Manage outlet configuration, hardware, and operational defaults.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar for Settings */}
        <div className="space-y-1">
          <Button variant="secondary" className="w-full justify-start"><Store className="w-4 h-4 mr-2" /> Outlet Details</Button>
          <Button variant="ghost" className="w-full justify-start"><Receipt className="w-4 h-4 mr-2" /> Taxes & Compliance</Button>
          <Button variant="ghost" className="w-full justify-start"><Printer className="w-4 h-4 mr-2" /> Hardware & Printers</Button>
          <Button variant="ghost" className="w-full justify-start"><Bell className="w-4 h-4 mr-2" /> Notifications</Button>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><ShieldAlert className="w-4 h-4 mr-2" /> Danger Zone</Button>
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3 space-y-8">
          
          <Card>
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

          <Card>
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
          </Card>

          <Card>
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

        </div>
      </div>
    </div>
  );
}
