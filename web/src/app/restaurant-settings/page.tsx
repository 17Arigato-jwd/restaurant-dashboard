"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogMedia } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { RolesManagement } from "@/components/RolesManagement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { useAppStore } from "@/store/useAppStore";
import { authHeaders } from "@/lib/api";
import { Store, Receipt, Printer, Bell, ShieldAlert, Save, Trash2, PowerOff } from "lucide-react";

interface Hardware {
  name: string;
  ip: string;
  model: string;
  online: boolean;
}

interface RestaurantSettings {
  name: string;
  concept: string;
  address: string;
  phone: string;
  fssai: string;
  logoUrl: string;
  taxes: { gst: boolean; serviceCharge: boolean; packaging: boolean };
  notifications: { inventory: boolean; voids: boolean; endOfDay: boolean };
  hardware: Hardware[];
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "Easy Restaurant SPA",
  concept: "Casual Dining",
  address: "123 Food Street, Koramangala, Bangalore 560034",
  phone: "+91 98765 43210",
  fssai: "11223344556677",
  logoUrl: "",
  taxes: { gst: true, serviceCharge: false, packaging: true },
  notifications: { inventory: true, voids: true, endOfDay: true },
  hardware: [
    { name: "Front Desk Printer (Billing)", ip: "192.168.1.100", model: "Epson TM-T82X", online: true },
    { name: "Kitchen Printer (KOT Backup)", ip: "192.168.1.101", model: "TVS RP 3200", online: false },
  ],
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("outlet");
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  const currentUser = useAppStore((state) => state.currentUser);
  const restaurantId: string | undefined = currentUser?.restaurantId;

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.settings) return;
        const stored = data.settings as Partial<RestaurantSettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...stored,
          taxes: { ...DEFAULT_SETTINGS.taxes, ...(stored.taxes || {}) },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored.notifications || {}) },
          hardware: stored.hardware?.length ? stored.hardware : DEFAULT_SETTINGS.hardware,
        });
      } catch {
        // Backend unavailable: keep local defaults.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const update = (patch: Partial<RestaurantSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!restaurantId) {
      toast.add({ type: "error", title: "Save failed", description: "No restaurant is linked to this account." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        let message = "Could not save settings.";
        try {
          message = (await res.json()).error || message;
        } catch {}
        throw new Error(message);
      }
      toast.add({ type: "success", title: "Saved", description: "Restaurant settings saved permanently." });
    } catch (error: unknown) {
      toast.add({
        type: "error",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePrinter = (index: number) => {
    const hardware = settings.hardware.map((printer, i) =>
      i === index ? { ...printer, online: !printer.online } : printer,
    );
    update({ hardware });
  };

  const discoverPrinters = () => {
    const nextIndex = settings.hardware.length + 1;
    update({
      hardware: [
        ...settings.hardware,
        { name: `Discovered Printer ${nextIndex}`, ip: `192.168.1.${100 + nextIndex}`, model: "Generic ESC/POS", online: true },
      ],
    });
    toast.add({ description: "Added a discovered printer. Remember to save." });
  };

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
              isActive={activeTab === "roles"}
              onClick={() => setActiveTab("roles")}
            >
              <ShieldAlert className="w-4 h-4" /> <span>Roles & Permissions</span>
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
          {!restaurantId && (
            <Alert className="mb-4">
              <AlertTitle>Not linked to a restaurant</AlertTitle>
              <AlertDescription>
                Sign in again so this account receives a restaurant id before saving settings.
              </AlertDescription>
            </Alert>
          )}

          {activeTab === "outlet" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Outlet Information</CardTitle>
                <CardDescription>Primary details displayed on bills and customer receipts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-6 w-full max-w-sm">
                  <Label className="mb-2 block text-sm font-bold">Restaurant Logo</Label>
                  <ImageUploader
                    defaultTitle="Upload restaurant logo"
                    className="w-full"
                    onUpload={async (file) => {
                      const url = URL.createObjectURL(file);
                      update({ logoUrl: url });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">This logo will be printed on bills and receipts.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Restaurant Name</Label>
                    <Input value={settings.name} onChange={(e) => update({ name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Concept Type</Label>
                    <Input value={settings.concept} onChange={(e) => update({ concept: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input value={settings.address} onChange={(e) => update({ address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Support Phone (Printed on Bill)</Label>
                    <Input value={settings.phone} onChange={(e) => update({ phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>FSSAI License Number</Label>
                    <Input value={settings.fssai} onChange={(e) => update({ fssai: e.target.value })} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Outlet Details"}</Button>
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
                  <Switch
                    checked={settings.taxes.gst}
                    onCheckedChange={(checked) => update({ taxes: { ...settings.taxes, gst: checked } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Enable Service Charge</h4>
                    <p className="text-sm text-muted-foreground">Automatically add 10% Service Charge to Dine-In bills.</p>
                  </div>
                  <Switch
                    checked={settings.taxes.serviceCharge}
                    onCheckedChange={(checked) => update({ taxes: { ...settings.taxes, serviceCharge: checked } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Packaging Charge (Delivery)</h4>
                    <p className="text-sm text-muted-foreground">Flat ₹20 per order for Aggregators & ONDC.</p>
                  </div>
                  <Switch
                    checked={settings.taxes.packaging}
                    onCheckedChange={(checked) => update({ taxes: { ...settings.taxes, packaging: checked } })}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Tax Rules"}</Button>
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
                {settings.hardware.map((printer, index) => (
                  <div key={`${printer.ip}-${index}`} className="p-4 border rounded-lg flex justify-between items-center bg-muted/10">
                    <div>
                      <h4 className="font-bold text-sm">{printer.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">IP: {printer.ip} ({printer.model})</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePrinter(index)}
                      title="Toggle status and save to persist"
                    >
                      {printer.online ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">Online</Badge>
                      ) : (
                        <Badge variant="destructive">Offline</Badge>
                      )}
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={discoverPrinters}>Discover New Printers on Network</Button>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Hardware"}</Button>
              </CardFooter>
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
                  <Switch
                    checked={settings.notifications.inventory}
                    onCheckedChange={(checked) => update({ notifications: { ...settings.notifications, inventory: checked } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Suspicious Voids / Overrides</h4>
                    <p className="text-xs text-muted-foreground mt-1">Alert when a cashier cancels a paid bill.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.voids}
                    onCheckedChange={(checked) => update({ notifications: { ...settings.notifications, voids: checked } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Daily End-of-Day Report</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receive the Tally summary email at midnight.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.endOfDay}
                    onCheckedChange={(checked) => update({ notifications: { ...settings.notifications, endOfDay: checked } })}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Notifications"}</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "roles" && (
            <Card className="animate-in fade-in duration-300 slide-in-from-right-4">
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage user roles and authorization levels.</CardDescription>
              </CardHeader>
              <CardContent>
                <RolesManagement />
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
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Actions taken in this section are immediate and permanent. Please proceed with caution.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center justify-between p-4 border-2 border-border bg-secondary-background rounded-base">
                  <div>
                    <h4 className="font-bold text-sm">Factory Reset POS Data</h4>
                    <p className="text-xs text-muted-foreground mt-1">Erases all offline local storage, tables, and mock data.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                      <Trash2 className="w-4 h-4 mr-2" /> Reset Local Data
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-black text-white">
                          <Trash2 className="w-6 h-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your POS data. Please type <span className="font-bold text-foreground">factory-reset</span> to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="px-4 py-4">
                        <Input placeholder="factory-reset" />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">Reset Data</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center justify-between p-4 border-2 border-border bg-secondary-background rounded-base">
                  <div>
                    <h4 className="font-bold text-sm">Force Shut Down API Bridge</h4>
                    <p className="text-xs text-muted-foreground mt-1">Disconnects Aggregators & Tally immediately.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                      <PowerOff className="w-4 h-4 mr-2" /> Disconnect APIs
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogMedia className="bg-black text-white">
                          <PowerOff className="w-6 h-6" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Disconnect API Bridge?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will halt all orders from Zomato and Swiggy. Type <span className="font-bold text-foreground">disconnect</span> to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="px-4 py-4">
                        <Input placeholder="disconnect" />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">Disconnect</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
