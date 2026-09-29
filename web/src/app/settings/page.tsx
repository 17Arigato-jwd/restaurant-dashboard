"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-black mb-2">Account Settings</h1>
        <p className="text-muted-foreground font-bold">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 font-bold">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p>Restaurant Admin</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>admin@restaurant.com</p>
            </div>
          </div>
          <Button variant="neutral" className="mt-4">Edit Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Reports</CardTitle>
          <CardDescription>Configure how you receive your weekly business performance summaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">Email Reports</Label>
              <p className="text-sm text-muted-foreground font-bold">Receive a weekly summary in your inbox.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">WhatsApp Reports</Label>
              <p className="text-sm text-muted-foreground font-bold">Get a quick text summary every Monday morning.</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">Detailed PDF Attachments</Label>
              <p className="text-sm text-muted-foreground font-bold">Include a full PDF breakdown of item-wise sales.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button className="mt-4 w-full sm:w-auto">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
